import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Upload, message, Avatar, Modal } from 'antd';
import { UserOutlined, MailOutlined, KeyOutlined, UploadOutlined, CameraOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { DatabaseService, UserProfile } from '../services/database';
import type { RcFile } from 'antd/es/upload/interface';
import { useNavigate, useLocation } from 'react-router-dom';
import { SettingsLayout } from "@/components/Layouts/SettingsOptionLayout"
import OptionLayout from "~/components/Layouts/Layout"
import PersonalSettings from "@/components/Option/Settings/PersonalSettings"

const OptionSettingsProfilePage = () => {
    return (
        <OptionLayout>
            <SettingsLayout>
                <PersonalSettings />
            </SettingsLayout>
        </OptionLayout>
    )
}

export default OptionSettingsProfilePage; 