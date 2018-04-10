/**
 * Created by Bardiaswift
 *
 * @flow
 */

import React, { PureComponent } from 'react';
import type { ElementRef } from 'react';
import ReactNative, { ScrollView, Animated, TextInput, Keyboard, UIManager } from 'react-native';

type Coords = { x: number, y: number };
type Props = {
  extraHeight: number,
  extraScrollHeight: number,
  bottomOffset: number,
  bottomInset: number,
  resetScrollToCoords?: Coords,
  disableAutomaticScroll?: boolean,
  onScroll?: Function,
  animatedValue?: Animated.Value,
  keyboardOpeningTime: number,
};

export default class KeyboardAwareScrollView extends PureComponent<Props, *> {
  static defaultProps = {
    extraHeight: 75,
    extraScrollHeight: 0,
    bottomOffset: 0,
    bottomInset: 0,
    keyboardOpeningTime: 250,
  }

  scrollView: ?Object
  isBlockNextScrollToResetCoords = false
  position = { x: 0, y: 0 }
  resetCoords: ?Coords
  defaultResetScrollToCoords: ?Coords
  keyboardListeners = []

  state = {
    keyboardSpace: this.props.bottomInset,
  }

  componentDidMount() {
    const { resetScrollToCoords, animatedValue } = this.props;
    this.keyboardListeners.push(
      Keyboard.addListener('keyboardWillShow', this.updateKeyboardSpace),
      Keyboard.addListener('keyboardWillHide', this.resetKeyboardSpace),
    );
    if (resetScrollToCoords) {
      this.resetCoords = resetScrollToCoords;
    }
    if (animatedValue) {
      animatedValue.addListener(({ value }) => {
        this.position = { x: 0, y: value };
      });
    }
  }

  componentWillUnmount() {
    this.keyboardListeners.forEach((listener) => {
      listener.remove();
    });
  }

  blockScrollToDefaultResetCoords = () => {
    this.isBlockNextScrollToResetCoords = true;
  }

  updateKeyboardSpace = (frames: { endCoordinates: { height: number, screenY: number } }) => {
    const { bottomOffset, disableAutomaticScroll } = this.props;
    this.setState(() => ({ keyboardSpace: frames.endCoordinates.height - bottomOffset }));
    if (!disableAutomaticScroll) {
      const currentlyFocusedField = TextInput.State.currentlyFocusedField();
      const responder = this.getScrollResponder();
      if (!currentlyFocusedField || !responder) {
        return;
      }

      UIManager.viewIsDescendantOf(
        currentlyFocusedField,
        responder.getInnerViewNode(),
        (isAncestor) => {
          if (isAncestor) {
            UIManager.measureInWindow(currentlyFocusedField, (x, y, width, height) => {
              const { bottomOffset, bottomInset, extraHeight } = this.props;
              if (
                (y + height) - bottomOffset - bottomInset >
                frames.endCoordinates.screenY - extraHeight
              ) {
                this.scrollToFocusedInputWithNodeHandle(currentlyFocusedField);
              }
            });
          }
        },
      );
    }

    if (!this.resetCoords) {
      if (!this.isBlockNextScrollToResetCoords) {
        if (!this.defaultResetScrollToCoords) {
          this.defaultResetScrollToCoords = this.position;
        }
      } else {
        this.isBlockNextScrollToResetCoords = false;
      }
    }
  }

  resetKeyboardSpace = () => {
    this.setState(() => ({ keyboardSpace: this.props.bottomInset }));
    if (this.resetCoords) {
      this.scrollToPosition(this.resetCoords.x, this.resetCoords.y, true);
    } else if (!this.isBlockNextScrollToResetCoords) {
      if (this.defaultResetScrollToCoords) {
        const { x, y } = this.defaultResetScrollToCoords;
        this.scrollToPosition(x, y, true);
        this.defaultResetScrollToCoords = null;
      } else {
        this.scrollToPosition(0, 0, true);
      }
    }
  }

  getScrollResponder = () => {
    const { scrollView, props: { animatedValue } } = this;
    if (scrollView) {
      const component = animatedValue ? scrollView._component : scrollView;
      return component.getScrollResponder();
    }
    return null;
  }

  scrollToPosition = (x: number, y: number, animated: boolean = false) => {
    const responder = this.getScrollResponder();
    if (responder) {
      responder.scrollResponderScrollTo({ x, y, animated });
    }
  }

  scrollToEnd = (animated?: boolean) => {
    const responder = this.getScrollResponder();
    if (responder) {
      responder.scrollResponderScrollToEnd({ animated });
    }
  }

  scrollToFocusedInput = (reactNode: ?number, extraHeight: number = this.props.extraHeight) => {
    setTimeout(() => {
      const responder = this.getScrollResponder();
      if (responder) {
        responder.scrollResponderScrollNativeHandleToKeyboard(reactNode, extraHeight, true);
      }
    }, this.props.keyboardOpeningTime);
  }

  scrollToFocusedInputWithNodeHandle = (
    nodeID: number | ElementRef<*>,
    extraHeight: number = this.props.extraHeight,
  ) => {
    const reactNode = ReactNative.findNodeHandle(nodeID);
    this.scrollToFocusedInput(reactNode, extraHeight + this.props.extraScrollHeight)
  }

  onScrollViewScroll = (event: { nativeEvent: { contentOffset: { x: number, y: number } } }) => {
    this.position = event.nativeEvent.contentOffset;
    const { onScroll } = this.props;
    if (onScroll) {
      onScroll(event);
    }
  }

  onAnimatedScrollViewScroll = this.props.animatedValue && Animated.event(
    [{ nativeEvent: { contentOffset: { y: this.props.animatedValue } } }],
    { useNativeDriver: true },
  )

  render() {
    const {
      props: { animatedValue },
      state: { keyboardSpace },
      onScrollViewScroll,
      onAnimatedScrollViewScroll,
    } = this;
    let Component;
    let onScroll;
    if (animatedValue) {
      Component = Animated.ScrollView;
      onScroll = onAnimatedScrollViewScroll;
    } else {
      Component = ScrollView;
      onScroll = onScrollViewScroll;
    }
    return (
      <Component
        ref={(ref) => { this.scrollView = ref; }}
        keyboardDismissMode="interactive"
        contentInset={{ bottom: keyboardSpace }}
        showsVerticalScrollIndicator
        scrollEventThrottle={1}
        automaticallyAdjustContentInsets={false}
        keyboardShouldPersistTaps="handled"
        {...this.props}
        onScroll={onScroll}
      />
    );
  }
}
