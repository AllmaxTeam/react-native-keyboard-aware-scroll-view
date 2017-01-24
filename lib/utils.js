/**
 * Created by Bardiaswift on 24/01/2017.
 */
export const makeProps = ({ state, props, handleOnScroll }) => {
  const { onScroll } = props;
  return {
    ref: '_rnkasv_keyboardView',
    keyboardDismissMode: 'interactive',
    contentInset: {bottom: state.keyboardSpace},
    showsVerticalScrollIndicator: true,
    scrollEventThrottle: 8,
    automaticallyAdjustContentInsets: false,
    keyboardShouldPersistTaps: 'handled',
    ...props,
    onScroll: e => {
      handleOnScroll(e)
      onScroll && onScroll(e)
    }
  }
};
