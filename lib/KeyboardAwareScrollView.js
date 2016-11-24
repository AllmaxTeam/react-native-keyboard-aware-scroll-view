/* @flow */

import React, { PropTypes } from 'react'
import { ScrollView } from 'react-native'
import KeyboardAwareMixin from './KeyboardAwareMixin'

const KeyboardAwareScrollView = React.createClass({
  propTypes: {
    ...ScrollView.propTypes,
    resetScrollToCoords: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    }),
    bottomOffset: PropTypes.number,
  },
  mixins: [KeyboardAwareMixin],

  componentWillMount: function () {
    this.setResetScrollToCoords(this.props.resetScrollToCoords)
  },

  getScrollResponder() {
    return this.refs._rnkasv_keyboardView.getScrollResponder()
  },

  render: function () {
    return (
      <ScrollView
        ref='_rnkasv_keyboardView'
        keyboardDismissMode='interactive'
        contentInset={{bottom: this.state.keyboardSpace}}
        showsVerticalScrollIndicator={true}
        {...this.props}
        scrollEventThrottle={8}
        onScroll={e => {
          this.handleOnScroll(e)
          this.props.onScroll && this.props.onScroll(e)
        }}
        automaticallyAdjustContentInsets={false}
      >
        {this.props.children}
      </ScrollView>
    )
  },
})

export default KeyboardAwareScrollView
