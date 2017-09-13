/**
 * Created by Bardiaswift
 *
 * @flow
 */

import React, { PureComponent } from 'react';
import ReactNative, { ScrollView, Animated, TextInput, Keyboard, UIManager } from 'react-native';

type Coords = { x: number, y: number };

export default class KeyboardAwareScrollView extends PureComponent {
  props: {
    extraHeight: number,
    extraScrollHeight: number,
    bottomOffset: number,
    bottomInset: number,
    resetScrollToCoords?: Coords,
    disableAutomaticScroll?: boolean,
    onScroll?: Function,
    animatedValue?: Object,
    keyboardOpeningTime: number,
  }

  static defaultProps = {
    extraHeight: 75,
    extraScrollHeight: 0,
    bottomOffset: 0,
    bottomInset: 0,
    keyboardOpeningTime: 250,
  }

  scrollView: ?Object = null
  isBlockNextScrollToResetCoords = false;
  position = { x: 0, y: 0 }
  resetCoords: ?Coords = null
  defaultResetScrollToCoords: ?Coords = null
  keyboardListeners = []

  state = {
    keyboardSpace: this.props.bottomInset,
  }

  componentWillMount() {
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

  updateKeyboardSpace = (frames: Object) => {
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
              const { bottomOffset, extraHeight } = this.props;
              if ((y + height) - bottomOffset > frames.endCoordinates.screenY - extraHeight) {
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
    nodeID: number,
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

  onAnimatedScrollViewScroll = Animated.event(
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
    let scrollEventThrottle;
    let onScroll;
    if (animatedValue) {
      Component = Animated.ScrollView;
      scrollEventThrottle = 1;
      onScroll = onAnimatedScrollViewScroll;
    } else {
      Component = ScrollView;
      scrollEventThrottle = 8;
      onScroll = onScrollViewScroll;
    }
    return (
      <Component
        ref={(ref) => { this.scrollView = ref; }}
        keyboardDismissMode="interactive"
        contentInset={{ bottom: keyboardSpace }}
        showsVerticalScrollIndicator
        scrollEventThrottle={scrollEventThrottle}
        automaticallyAdjustContentInsets={false}
        keyboardShouldPersistTaps="handled"
        {...this.props}
        onScroll={onScroll}
      />
    );
  }
}
