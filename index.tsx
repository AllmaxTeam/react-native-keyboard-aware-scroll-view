import React, {
  ReactElement,
  ReactNode,
  ClassAttributes,
  memo,
  forwardRef,
  useRef,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
  useEffect,
  useImperativeHandle,
} from 'react';
import ReactNative, {
  ViewStyle,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewPropsIOS,
  ScrollViewProps,
  KeyboardEvent,
  TextInput,
  ScrollView,
  Platform,
  Animated,
  Keyboard,
  UIManager,
} from 'react-native';

interface Props {
  extraHeight?: number;
  extraScrollHeight?: number;
  bottomOffset?: number;
  bottomInset?: number;
  indicatorStyle?: ScrollViewPropsIOS['indicatorStyle'];
  onScroll?: Function;
  animatedValue?: Animated.Value;
  keyboardOpeningTime?: number;
  children?: ReactNode;
  bounces?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  refreshControl?: ReactElement;
  onComponentDidUpdateDuringKeyboardShow?: () => void;
  onComponentDidUpdateWhenKeyboardNotShown?: () => void;
}

export interface KeyboardAdjustedScrollViewHandle {
  scrollToFocusedInput: (
    reactNode: number | null,
    extraHeight?: number,
  ) => void;
  scrollToPosition: (x: number, y: number, animated?: boolean) => void;
  scrollToEnd: (animated?: boolean) => void;
}

interface CommonScrollViewProps extends ScrollViewProps, ClassAttributes<ScrollView> {
  children: ReactNode;
}

export const KeyboardAdjustedScrollView = memo(
  forwardRef<KeyboardAdjustedScrollViewHandle, Props>(({
    extraHeight = 75,
    extraScrollHeight,
    bottomOffset = 0,
    bottomInset = 0,
    keyboardOpeningTime = 250,
    indicatorStyle,
    animatedValue,
    onScroll,
    children,
    bounces,
    style,
    contentContainerStyle,
    refreshControl,
    onComponentDidUpdateDuringKeyboardShow,
    onComponentDidUpdateWhenKeyboardNotShown,
  }, ref) => {
    const isComponentWillUpdateDuringKeyboardShowRef = useRef<boolean>(false);
    const isComponentWillUpdateWhenKeyboardNotShownRef = useRef<boolean>(false);
    const heightRef = useRef<number>(0);
    const contentHeightRef = useRef<number>(0);
    const yOffsetRef = useRef<number>(0);
    const keyboardSpaceRef = useRef<number>(bottomInset);
    const scrollViewRef = useRef<ScrollView>(null);
    const openedKeyboardEventRef = useRef<KeyboardEvent | null>(null);

    const [keyboardSpace, setKeyboardSpace] = useState<number>(bottomInset);

    const storeKeyboardSpace = useCallback((nextKeyboardSpace: number) => {
      setKeyboardSpace(nextKeyboardSpace);
      keyboardSpaceRef.current = nextKeyboardSpace;
    }, []);

    const getScrollResponder = useCallback((): ScrollView | null => {
      const {
        current: scrollViewNode,
      } = scrollViewRef;
      if (scrollViewNode != null) {
        const component = (
          // eslint-disable-next-line no-underscore-dangle
          animatedValue != null ? (scrollViewNode as any)._component : scrollViewNode
        );
        return component.getScrollResponder();
      }
      return null;
    }, [animatedValue]);

    const scrollToPosition = useCallback((x: number, y: number, animated: boolean = false) => {
      const responder = getScrollResponder();
      if (responder != null) {
        responder.scrollResponderScrollTo({ x, y, animated });
      }
    }, [getScrollResponder]);

    const scrollToEnd = useCallback((animated?: boolean) => {
      const responder = getScrollResponder();
      if (responder != null) {
        (responder as any).scrollResponderScrollToEnd({ animated });
      }
    }, [getScrollResponder]);

    const scrollToFocusedInput = useCallback((
      reactNode: number | null,
      passedExtraHeight: number = extraHeight,
    ) => {
      setTimeout(() => {
        const responder = getScrollResponder();
        if (responder != null) {
          responder.scrollResponderScrollNativeHandleToKeyboard(reactNode, passedExtraHeight, true);
        }
      }, keyboardOpeningTime);
    }, [extraHeight, keyboardOpeningTime, getScrollResponder]);

    const scrollToFocusedInputWithNodeHandle = useCallback((
      nodeID: number,
      passedExtraHeight: number = extraHeight,
    ) => {
      const reactNode = ReactNative.findNodeHandle(nodeID);
      let extraHeightWithScrollHeight = passedExtraHeight;
      if (extraScrollHeight != null) {
        extraHeightWithScrollHeight += extraScrollHeight;
      }
      scrollToFocusedInput(reactNode, extraHeightWithScrollHeight);
    }, [extraHeight, extraScrollHeight, scrollToFocusedInput]);

    const onKeyboardShow = useCallback((keyboardEvent: KeyboardEvent) => {
      openedKeyboardEventRef.current = keyboardEvent;
    }, []);

    const onKeyboardHide = useCallback(() => {
      openedKeyboardEventRef.current = null;
    }, []);

    const updateKeyboardSpace = useCallback((keyboardEvent: KeyboardEvent) => {
      const {
        endCoordinates,
      } = keyboardEvent;
      const targetKeyboardSpace = endCoordinates.height + bottomInset - bottomOffset;
      const nextKeyboardSpace = (
        targetKeyboardSpace < bottomInset ? bottomInset : targetKeyboardSpace
      );
      if (nextKeyboardSpace !== keyboardSpaceRef.current) {
        const {
          current: isComponentWillUpdateDuringKeyboardShow,
        } = isComponentWillUpdateDuringKeyboardShowRef;
        if (!isComponentWillUpdateDuringKeyboardShow) {
          isComponentWillUpdateDuringKeyboardShowRef.current = true;
        }
        storeKeyboardSpace(nextKeyboardSpace);
      }
      if (extraScrollHeight != null) {
        const currentlyFocusedField = TextInput.State.currentlyFocusedField();
        const responder = getScrollResponder();
        if (currentlyFocusedField != null && responder != null) {
          (UIManager as any).viewIsDescendantOf(
            currentlyFocusedField,
            responder.getInnerViewNode(),
            (isAncestor: boolean) => {
              if (isAncestor) {
                UIManager.measureInWindow(currentlyFocusedField, (x, y, width, height) => {
                  if (
                    (y + height) - bottomOffset - bottomInset > endCoordinates.screenY - extraHeight
                  ) {
                    scrollToFocusedInputWithNodeHandle(currentlyFocusedField);
                  }
                });
              }
            },
          );
        }
      }
    }, [
      bottomOffset,
      extraScrollHeight,
      bottomInset,
      extraHeight,
      storeKeyboardSpace,
      getScrollResponder,
      scrollToFocusedInputWithNodeHandle,
    ]);

    const resetKeyboardSpace = useCallback(() => {
      const {
        current: height,
      } = heightRef;
      const {
        current: contentHeight,
      } = contentHeightRef;
      const {
        current: yOffset,
      } = yOffsetRef;
      isComponentWillUpdateWhenKeyboardNotShownRef.current = true;
      storeKeyboardSpace(bottomInset);
      const yMaxOffset = contentHeight - height + bottomInset;
      if (yOffset > yMaxOffset) {
        scrollToPosition(0, yMaxOffset, true);
      }
    }, [bottomInset, storeKeyboardSpace, scrollToPosition]);

    const onLayout = useCallback(({
      nativeEvent: {
        layout: {
          height,
        },
      },
    }: LayoutChangeEvent) => {
      heightRef.current = height;
    }, []);

    const onContentSizeChange = useCallback((width: number, height: number) => {
      contentHeightRef.current = height;
    }, []);

    const onScrollViewScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {
        nativeEvent: {
          contentOffset: {
            y,
          },
        },
      } = event;
      yOffsetRef.current = y;
      if (onScroll != null) {
        onScroll(event);
      }
    }, [onScroll]);

    const onAnimatedScrollViewScroll = useMemo(() => (animatedValue != null ? Animated.event(
      [{ nativeEvent: { contentOffset: { y: animatedValue } } }],
      { useNativeDriver: true },
    ) : undefined), [animatedValue]);

    if (Platform.OS === 'ios') {
      useLayoutEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
          'keyboardWillShow',
          onKeyboardShow,
        );
        const keyboardWillHideListener = Keyboard.addListener(
          'keyboardWillHide',
          onKeyboardHide,
        );
        return () => {
          keyboardWillShowListener.remove();
          keyboardWillHideListener.remove();
        };
      }, [onKeyboardShow, onKeyboardHide]);

      useLayoutEffect(() => {
        if (animatedValue != null) {
          animatedValue.addListener(({ value }) => {
            yOffsetRef.current = value;
          });
        }

        const keyboardWillShowListener = Keyboard.addListener(
          'keyboardWillShow',
          updateKeyboardSpace,
        );
        const keyboardWillHideListener = Keyboard.addListener(
          'keyboardWillHide',
          resetKeyboardSpace,
        );
        return () => {
          keyboardWillShowListener.remove();
          keyboardWillHideListener.remove();
        };
      }, [animatedValue, updateKeyboardSpace, resetKeyboardSpace]);

      useLayoutEffect(() => {
        const {
          current: openedKeyboardEvent,
        } = openedKeyboardEventRef;
        if (openedKeyboardEvent != null) {
          updateKeyboardSpace(openedKeyboardEvent);
        } else {
          resetKeyboardSpace();
        }
      }, [updateKeyboardSpace, resetKeyboardSpace]);

      useLayoutEffect(() => {
        const {
          current: isComponentWillUpdateDuringKeyboardShow,
        } = isComponentWillUpdateDuringKeyboardShowRef;
        if (
          isComponentWillUpdateDuringKeyboardShow
          && onComponentDidUpdateDuringKeyboardShow != null
        ) {
          isComponentWillUpdateDuringKeyboardShowRef.current = false;
          onComponentDidUpdateDuringKeyboardShow();
        }
      }, [keyboardSpace, onComponentDidUpdateDuringKeyboardShow]);

      useEffect(() => {
        const {
          current: isComponentWillUpdateWhenKeyboardNotShown,
        } = isComponentWillUpdateWhenKeyboardNotShownRef;
        if (
          isComponentWillUpdateWhenKeyboardNotShown
          && onComponentDidUpdateWhenKeyboardNotShown != null
        ) {
          isComponentWillUpdateWhenKeyboardNotShownRef.current = false;
          onComponentDidUpdateWhenKeyboardNotShown();
        }
      }, [keyboardSpace, onComponentDidUpdateWhenKeyboardNotShown]);
    }

    useImperativeHandle(ref, () => ({
      scrollToFocusedInput,
      scrollToPosition,
      scrollToEnd,
    }), [scrollToFocusedInput, scrollToPosition, scrollToEnd]);

    const contentInset = useMemo(() => ({
      bottom: keyboardSpace,
    }), [keyboardSpace]);

    const commonProps: CommonScrollViewProps = {
      ref: scrollViewRef,
      keyboardDismissMode: 'interactive',
      contentInset,
      showsVerticalScrollIndicator: true,
      scrollEventThrottle: 1,
      automaticallyAdjustContentInsets: false,
      keyboardShouldPersistTaps: 'handled',
      indicatorStyle,
      children,
      bounces,
      style,
      contentContainerStyle,
      refreshControl,
      onLayout,
      onContentSizeChange,
    };

    return animatedValue != null ? (
      <Animated.ScrollView
        onScroll={onAnimatedScrollViewScroll}
        {...commonProps}
      />
    ) : (
      <ScrollView
        onScroll={onScrollViewScroll}
        {...commonProps}
      />
    );
  }),
);
