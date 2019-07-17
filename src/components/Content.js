import React from 'react';
import ContentHeader from './ContentHeader';
import Render from './Render';
import { observer } from 'mobx-react';
import Status from './Status';
import PropTypes from 'prop-types';

const Content = ({ RS }) =>
    <div id="content">
        <ContentHeader />
        <Render RS={RS} />
        <Status />
    </div>;

Content.propTypes = {
    RS: PropTypes.object
};

export default observer(Content);
