import React from 'react';

const {wk, rk} = require('./WeakKey.js');

export default class TableList extends React.Component {
	constructor (props) {
		super(props);
	}

	componentDidMount () {
	}

	componentWillUnmount () {
	}

	render () {
		return (
			<div className="table-wrapper fill">
				<table>
					<thead>
					<tr>
						<th width="80%">Nombre</th>
						<th width="20%">Duración</th>
					</tr>
					</thead>
				</table>
				<table className="table-striped">
					<tbody>

					</tbody>
				</table>
			</div>
		);
	}
}