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
  useImperativeHandle,
} from 'react';
import ReactNative, {
  ViewStyle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
  KeyboardEvent,
  TextInput,
  ScrollView,
  Animated,
  Keyboard,
  UIManager,
} from 'react-native';

interface Coords {
  x: number;
  y: number;
}

interface Props {
  extraHeight?: number;
  extraScrollHeight?: number;
  bottomOffset?: number;
  bottomInset?: number;
  resetScrollToCoords?: Coords;
  disableAutomaticScroll?: boolean;
  onScroll?: Function;
  animatedValue?: Animated.Value;
  keyboardOpeningTime?: number;
  children?: Node;
  bounces?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  refreshControl?: ReactElement;
  ref?: any;
}

export const KeyboardAdjustedScrollView = memo<Props>(forwardRef<any, Props>(({
  extraHeight = 75,
  extraScrollHeight = 0,
  bottomOffset = 0,
  bottomInset = 0,
  keyboardOpeningTime = 250,
  disableAutomaticScroll,
  animatedValue,
  onScroll,
  children,
  bounces,
  resetScrollToCoords,
  style,
  contentContainerStyle,
  refreshControl,
}, ref) => {
  const isBlockNextScrollToResetCoordsRef = useRef<boolean>(false);
  const positionRef = useRef<Coords>({ x: 0, y: 0 });
  const resetCoordsRef = useRef<Coords | undefined>(resetScrollToCoords);
  const defaultResetScrollToCoordsRef = useRef<Coords | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [keyboardSpace, setKeyboardSpace] = useState<number>(bottomInset);

  const getScrollResponder = useCallback((): ScrollView | null => {
    const {
      current: scrollViewNode,
    } = scrollViewRef;
    if (scrollViewNode != null) {
      // eslint-disable-next-line no-underscore-dangle
      const component = animatedValue != null ? (scrollViewNode as any)._component : scrollViewNode;
      return component.getScrollResponder();
    }
    return null;
  }, [animatedValue]);

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
    scrollToFocusedInput(reactNode, passedExtraHeight + extraScrollHeight);
  }, [extraHeight, extraScrollHeight, scrollToFocusedInput]);

  const updateKeyboardSpace = useCallback(({
    endCoordinates,
  }: KeyboardEvent) => {
    setKeyboardSpace(endCoordinates.height - bottomOffset);
    if (!disableAutomaticScroll) {
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

    const {
      current: resetCoords,
    } = resetCoordsRef;
    if (resetCoords == null) {
      const {
        current: isBlockNextScrollToResetCoords,
      } = isBlockNextScrollToResetCoordsRef;
      if (!isBlockNextScrollToResetCoords) {
        const {
          current: defaultResetScrollToCoords,
        } = defaultResetScrollToCoordsRef;
        if (defaultResetScrollToCoords == null) {
          const {
            current: position,
          } = positionRef;
          defaultResetScrollToCoordsRef.current = position;
        }
      } else {
        isBlockNextScrollToResetCoordsRef.current = false;
      }
    }
  }, [
    bottomOffset,
    disableAutomaticScroll,
    bottomInset,
    extraHeight,
    setKeyboardSpace,
    getScrollResponder,
    scrollToFocusedInputWithNodeHandle,
  ]);

  const blockScrollToDefaultResetCoords = useCallback(() => {
    isBlockNextScrollToResetCoordsRef.current = true;
  }, []);

  const scrollToPosition = useCallback((x: number, y: number, animated: boolean = false) => {
    const responder = getScrollResponder();
    if (responder != null) {
      responder.scrollResponderScrollTo({ x, y, animated });
    }
  }, [getScrollResponder]);

  const resetKeyboardSpace = useCallback(() => {
    const {
      current: resetCoords,
    } = resetCoordsRef;
    setKeyboardSpace(bottomInset);
    if (resetCoords != null) {
      const { x, y } = resetCoords;
      scrollToPosition(x, y, true);
    } else {
      const {
        current: isBlockNextScrollToResetCoords,
      } = isBlockNextScrollToResetCoordsRef;
      if (!isBlockNextScrollToResetCoords) {
        const {
          current: defaultResetScrollToCoords,
        } = defaultResetScrollToCoordsRef;
        if (defaultResetScrollToCoords != null) {
          const { x, y } = defaultResetScrollToCoords;
          scrollToPosition(x, y, true);
          defaultResetScrollToCoordsRef.current = null;
        } else {
          scrollToPosition(0, 0, true);
        }
      }
    }
  }, [bottomInset, scrollToPosition]);

  const scrollToEnd = useCallback((animated?: boolean) => {
    const responder = getScrollResponder();
    if (responder != null) {
      (responder as any).scrollResponderScrollToEnd({ animated });
    }
  }, [getScrollResponder]);

  const onScrollViewScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    positionRef.current = event.nativeEvent.contentOffset;
    if (onScroll != null) {
      onScroll(event);
    }
  }, [onScroll]);

  const onAnimatedScrollViewScroll = useMemo(() => (animatedValue != null ? Animated.event(
    [{ nativeEvent: { contentOffset: { y: animatedValue } } }],
    { useNativeDriver: true },
  ) : undefined), [animatedValue]);

  useLayoutEffect(() => {
    if (animatedValue != null) {
      animatedValue.addListener(({ value }) => {
        positionRef.current = { x: 0, y: value };
      });
    }

    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', updateKeyboardSpace);
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', resetKeyboardSpace);
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [animatedValue, updateKeyboardSpace, resetKeyboardSpace]);

  useImperativeHandle(ref, () => ({
    scrollToFocusedInput,
    scrollToPosition,
    scrollToEnd,
    blockScrollToDefaultResetCoords,
  }), [scrollToFocusedInput, scrollToPosition, scrollToEnd, blockScrollToDefaultResetCoords]);

  const contentInset = useMemo(() => ({
    bottom: keyboardSpace,
  }), [keyboardSpace]);

  const commonProps: ScrollViewProps & ClassAttributes<ScrollView> & { children: ReactNode } = {
    ref: scrollViewRef,
    keyboardDismissMode: 'interactive',
    contentInset,
    showsVerticalScrollIndicator: true,
    scrollEventThrottle: 1,
    automaticallyAdjustContentInsets: false,
    keyboardShouldPersistTaps: 'handled',
    children,
    bounces,
    style,
    contentContainerStyle,
    refreshControl,
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
}));
