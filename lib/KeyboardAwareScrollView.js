/* @flow */

import React, { PropTypes } from 'react'
import { ScrollView } from 'react-native'
import KeyboardAwareMixin from './KeyboardAwareMixin'
import { makeProps } from './utils'

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
      <ScrollView {...makeProps(this)} />
    )
  },
})

export default KeyboardAwareScrollView
