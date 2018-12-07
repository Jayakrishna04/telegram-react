/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import FileStore from '../../Stores/FileStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './FilesDropTarget.css';

class FilesDropTarget extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            dragging: ApplicationStore.getDragging()
        }
    }

    componentDidMount(){
        ApplicationStore.on('clientUpdateDragging', this.onClientUpdateDragging);
    }

    componentWillUnmount(){
        ApplicationStore.removeListener('clientUpdateDragging', this.onClientUpdateDragging);
    }

    onClientUpdateDragging = (update) => {
        this.setState({ dragging: ApplicationStore.getDragging() });
    };

    handleDragEnter = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        ApplicationStore.setDragging(false);

        this.handleAttachDocumentComplete(event.dataTransfer.files);
    };

    handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        ApplicationStore.setDragging(false);
    };

    handleAttachDocumentComplete = (files) => {
        if (files.length === 0) return;

        for (let i = 0; i < files.length; i++){
            let file = files[i];
            const content = {
                '@type': 'inputMessageDocument',
                document: { '@type': 'inputFileBlob', name: file.name, blob: file }
            };

            this.onSendInternal(content, result => FileStore.uploadFile(result.content.document.document.id, result));
        }
    };

    onSendInternal = (content, callback) => {
        const chatId = ApplicationStore.getChatId();
        if (!chatId) return;
        if (!content) return;

        TdLibController
            .send({
                '@type': 'sendMessage',
                chat_id: chatId,
                reply_to_message_id: 0,
                input_message_content: content
            })
            .then(result => {

                //MessageStore.set(result);

                TdLibController
                    .send({
                        '@type': 'viewMessages',
                        chat_id: chatId,
                        message_ids: [result.id]
                    });

                callback(result);
            })
            .catch(error => {
                alert('sendMessage error ' + JSON.stringify(error));
            });

        /*if (this.state.selectedChat.draft_message){
            TdLibController
                .send({
                    '@type': 'setChatDraftMessage',
                    chat_id: this.state.selectedChat.id,
                    draft_message: null
                });
        }*/
    };

    render() {
        const { dragging } = this.state;

        return (
            <>
                {   dragging &&
                    <div
                        className='files-drop-target'
                        onDragEnter={this.handleDragEnter}
                        onDragLeave={this.handleDragLeave}
                        onDrop={this.handleDrop}>
                        <div className='files-drop-target-wrapper'>
                            <div className='files-drop-target-text'>
                                <div className='files-drop-target-title'>Drop files here</div>
                                <div className='files-drop-target-subtitle'>to send them without compression</div>
                            </div>
                        </div>
                    </div>
                }
            </>);
    }
}

FilesDropTarget.propTypes = {};

export default FilesDropTarget;