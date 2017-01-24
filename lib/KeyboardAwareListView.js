/* @flow */

import React, { PropTypes } from 'react'
import { ListView } from 'react-native'
import KeyboardAwareMixin from './KeyboardAwareMixin'
import { makeProps } from './utils'

const KeyboardAwareListView = React.createClass({
  propTypes: {
    ...ListView.propTypes,
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
      <ListView {...makeProps(this)} />
    )
  },
})

export default KeyboardAwareListView
