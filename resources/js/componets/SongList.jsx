import React from 'react';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';

function collect (props) {
	return {data: props.data};
}

export default class SongList extends React.Component {
	constructor (props) {
		super(props);
		this.state = {data: [], current: null};

		this.updateSongs = this.updateSongs.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.ondblclickSong = this.ondblclickSong.bind(this);
	}

	componentDidMount () {
		let self = this;
		self.updateSongs();
	}

	componentWillUnmount () {
	}

	updateSongs () {
		console.log('updating song data');
		let self = this;
		this.props.db.getSongs(self.props.playlist, function (docs) {
			self.setState({data: docs});
		});
	}

	handleClick (e, data, target) {
		let self = this;

		if (data.action === 'edit') {
			self.props.vex.dialog.prompt({
				message: 'Nombre de Cancion',
				placeholder: 'Es requerido',
				value: data.data.name,
				callback: function (value) {
					if (value !== false) {
						self.props.db.changeNameSong(data.data._id, value, function () {
							self.updateSongs();
						});
					}
				},
			});
		}
		if (data.action === 'delete') {
			self.props.vex.dialog.confirm({
				message: 'Desea eliminar ' + data.data.name + ' del listado de canciones?',
				callback: function (value) {
					if (value) {
						self.props.db.deleteSong(data.data._id, function () {
							self.updateSongs();
						});
					}
				},
			});
		}
	}

	ondblclickSong (_id) {
		let state = this.state;
		state.current = _id;
		this.setState(state);
		this.props.ondblclickSong(_id);
	}

	render () {
		return (
			[
				<div key={'div_table'} className="table-wrapper fill" style={this.props.style}>
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
						{this.state.data.map((k, j) =>
								<tr key={k._id} className={this.state.current === k._id ? 'song_selected' : ''}>
									<td onDoubleClick={() => {this.ondblclickSong(k._id);}}>
										<ContextMenuTrigger key={k._id} id="contexmenu_song" collect={collect} data={k}>
											{k.name}
										</ContextMenuTrigger>
									</td>
									<td>{0}</td>
								</tr>
							,
						)}
						</tbody>
					</table>
				</div>,
				<ContextMenu key={'contexmenu_song'} id="contexmenu_song">
					<MenuItem onClick={this.handleClick} data={{action: 'edit'}}>
						Renombrar
					</MenuItem>
					<MenuItem onClick={this.handleClick} data={{action: 'delete'}}>
						Eliminar
					</MenuItem>
				</ContextMenu>,
			]
		);
	}
}