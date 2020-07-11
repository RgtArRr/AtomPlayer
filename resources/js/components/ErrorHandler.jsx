import React from 'react';

export default class ErrorHandler extends React.Component {
    constructor (props) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError (error) {
        return {hasError: true};
    }

    render () {
        if (this.state.hasError) {
            return (<div className="center">
                <h1>Something went wrong.</h1>
                <button onClick={() => {location.reload();}}>Click here to reload</button>
            </div>);
        }

        return this.props.children;
    }
}
