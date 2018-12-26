import React from 'react';

const {wk, rk} = require('../utils/WeakKey.js');
const vex = require('vex-js');
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-os';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

function collect (props) {
	return {data: props.data};
}

export default class PlayList extends React.Component {
	constructor (props) {
		super(props);
		this.state = {data: []};

		this.updatePlayList = this.updatePlayList.bind(this);
		this.handleClick = this.handleClick.bind(this);
	}

	componentDidMount () {
		let self = this;
		this.updatePlayList();
	}

	updatePlayList () {
		let self = this;
		this.props.db.getPlayLists(function (docs) {
			console.log(docs);
			self.setState({data: docs});
		});
	}

	componentWillUnmount () {
	}

	handleClick (e, data, target) {
		let self = this;

		if (data.action === 'add') {
			vex.dialog.prompt({
				message: 'Nombre de playlist',
				placeholder: 'Es requerido',
				callback: function (value) {
					if (value !== false) {
						self.props.db.addPlayList(value, function () {
							self.updatePlayList();
						});
					}
				},
			});
		}
		if (data.action === 'edit') {
			vex.dialog.prompt({
				message: 'Nombre de playlist',
				placeholder: 'Es requerido',
				value: data.data.name,
				callback: function (value) {
					if (value !== false) {
						self.props.db.changeNamePlayList(data.data._id, value, function () {
							self.updatePlayList();
						});
					}
				},
			});
		}
		if (data.action === 'delete') {
			vex.dialog.confirm({
				message: 'Desea eliminar '
				+ data.data.name + ', ademas del listado de canciones que contiene?',
				callback: function (value) {
					if (value) {
						self.props.db.deletePlayList(data.data._id, function () {
							self.updatePlayList();
						});
					}
				},
			});
		}
	}

	render () {
		let button_add_style = {
			position: 'absolute',
			right: '3px',
			top: '7px',
			padding: '3px 4px',
			borderColor: 'transparent',
		};
		return (
			[
				<nav key={'nav_playlist'} className="nav-group">
					<h5 className="nav-group-title">PlayLists</h5>
					<button style={button_add_style} className="btn btn-default"
					        onClick={() => {this.handleClick(this, {action: 'add'});}}>
						<span className="icon icon-plus"></span>
					</button>
					{this.state.data.map((k, j) =>
						<ContextMenuTrigger key={k._id} id="contexmenu_playlist" collect={collect} data={k}>
							<a className="nav-group-item active" onClick={() => {this.props.onChangePlayList(k._id);}}>
								<span className="icon icon-menu"></span>
								{k.name}
							</a>
						</ContextMenuTrigger>,
					)}
				</nav>,
				<ContextMenu key={'contexmenu_playlist'} id="contexmenu_playlist">
					<MenuItem onClick={this.handleClick} data={{action: 'edit'}}>
						Editar
					</MenuItem>
					<MenuItem onClick={this.handleClick} data={{action: 'delete'}}>
						Eliminar
					</MenuItem>
				</ContextMenu>,
			]
		);
	}
}