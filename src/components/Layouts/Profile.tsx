import React, { useState } from "react";
import { Form, Input, Button, Upload, message } from "antd";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";

const Profile = () => {
    const [form] = Form.useForm();
    const [avatar, setAvatar] = useState("");

    const onFinish = (values) => {
        console.log("Updated profile:", values);
        message.success("用户信息更新成功！");
    };

    const handleUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatar(e.target.result);
        };
        reader.readAsDataURL(file);
        return false; // 阻止默认上传行为
    };

    return (
        <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
            <h1>个人中心</h1>
            <Form form={form} onFinish={onFinish}>
                <Form.Item label="头像">
                    <Upload
                        name="avatar"
                        showUploadList={false}
                        beforeUpload={handleUpload}
                    >
                        <Button icon={<UploadOutlined />}>上传头像</Button>
                    </Upload>
                    {avatar && <img src={avatar} alt="avatar" style={{ width: "100px", marginTop: "12px" }} />}
                </Form.Item>
                <Form.Item label="用户名" name="username">
                    <Input prefix={<UserOutlined />} />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        更新信息
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Profile;