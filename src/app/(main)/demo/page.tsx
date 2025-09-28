'use client';

import { useState } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Switch, 
  Slider, 
  Rate,
  Progress,
  Tag,
  Avatar,
  Badge,
  Tooltip,
  Alert,
  Divider,
  Space,
  Typography,
  Row,
  Col
} from 'antd';
import { 
  HeartFilled, 
  StarOutlined, 
  UserOutlined, 
  BellOutlined,
  SettingOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { showToast } from '@/lib/toast';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function AntdDemoPage() {
  const [switchValue, setSwitchValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(30);
  const [rateValue, setRateValue] = useState(4);

  const handleButtonClick = (type: string) => {
    switch (type) {
      case 'success':
        showToast.success('Thành công! Đây là thông báo thành công.');
        break;
      case 'error':
        showToast.error('Có lỗi xảy ra! Đây là thông báo lỗi.');
        break;
      case 'info':
        showToast.loading('Đang xử lý...');
        break;
      case 'promise':
        const promise = new Promise((resolve, reject) => {
          setTimeout(() => {
            Math.random() > 0.5 ? resolve('Thành công!') : reject('Thất bại!');
          }, 2000);
        });
        showToast.promise(promise, {
          loading: 'Đang xử lý yêu cầu...',
          success: 'Yêu cầu đã được xử lý thành công!',
          error: 'Có lỗi xảy ra khi xử lý yêu cầu!',
        });
        break;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <Title level={1}>Demo Ant Design Components</Title>
        <Text type="secondary">
          Trang demo hiển thị các component của Ant Design với theme tùy chỉnh
        </Text>
      </div>

      {/* Toast Demo */}
      <Card title="🍞 Toast Notifications" className="mb-6">
        <Space wrap>
          <Button type="primary" onClick={() => handleButtonClick('success')}>
            Success Toast
          </Button>
          <Button danger onClick={() => handleButtonClick('error')}>
            Error Toast
          </Button>
          <Button type="default" onClick={() => handleButtonClick('info')}>
            Loading Toast
          </Button>
          <Button type="dashed" onClick={() => handleButtonClick('promise')}>
            Promise Toast
          </Button>
        </Space>
      </Card>

      {/* Basic Components */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="📝 Form Controls" className="h-full">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input 
                placeholder="Nhập text..." 
                prefix={<SearchOutlined />} 
              />
              
              <Select placeholder="Chọn tùy chọn" style={{ width: '100%' }}>
                <Option value="option1">Tùy chọn 1</Option>
                <Option value="option2">Tùy chọn 2</Option>
                <Option value="option3">Tùy chọn 3</Option>
              </Select>
              
              <DatePicker placeholder="Chọn ngày" style={{ width: '100%' }} />
              
              <div className="flex items-center justify-between">
                <Text>Dark Mode:</Text>
                <Switch 
                  checked={switchValue} 
                  onChange={setSwitchValue}
                />
              </div>
              
              <div>
                <Text>Slider: {sliderValue}</Text>
                <Slider 
                  value={sliderValue} 
                  onChange={setSliderValue}
                  max={100}
                />
              </div>
              
              <div>
                <Text>Rating: </Text>
                <Rate 
                  value={rateValue} 
                  onChange={setRateValue}
                  character={<HeartFilled />}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="🎨 Display Components" className="h-full">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Progress:</Text>
                <Progress percent={75} status="active" />
                <Progress percent={100} status="success" size="small" />
              </div>
              
              <div>
                <Text>Tags: </Text>
                <Space>
                  <Tag color="blue">Tag 1</Tag>
                  <Tag color="green">Tag 2</Tag>
                  <Tag color="orange">Tag 3</Tag>
                  <Tag color="red">Tag 4</Tag>
                </Space>
              </div>
              
              <div>
                <Text>Avatars: </Text>
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <Avatar style={{ backgroundColor: '#f56a00' }}>U</Avatar>
                  <Badge dot>
                    <Avatar icon={<BellOutlined />} />
                  </Badge>
                  <Badge count={99}>
                    <Avatar icon={<UserOutlined />} />
                  </Badge>
                </Space>
              </div>
              
              <div>
                <Text>Tooltips: </Text>
                <Space>
                  <Tooltip title="Tooltip text">
                    <Button>Hover me</Button>
                  </Tooltip>
                  <Tooltip title="Settings" placement="right">
                    <Button icon={<SettingOutlined />} />
                  </Tooltip>
                </Space>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      <Card title="⚠️ Alerts">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert message="Success Alert" type="success" />
          <Alert message="Info Alert" type="info" showIcon />
          <Alert message="Warning Alert" type="warning" showIcon closable />
          <Alert 
            message="Error Alert" 
            description="Detailed error message with description"
            type="error" 
            showIcon 
          />
        </Space>
      </Card>

      {/* Buttons */}
      <Card title="🔘 Buttons">
        <Space wrap>
          <Button type="primary">Primary</Button>
          <Button>Default</Button>
          <Button type="dashed">Dashed</Button>
          <Button type="text">Text</Button>
          <Button type="link">Link</Button>
          <Button danger>Danger</Button>
          <Button loading>Loading</Button>
          <Button icon={<StarOutlined />}>With Icon</Button>
        </Space>
      </Card>

      {/* Typography */}
      <Card title="📚 Typography">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={2}>Heading Level 2</Title>
          <Title level={3}>Heading Level 3</Title>
          <Title level={4}>Heading Level 4</Title>
          
          <Paragraph>
            Đây là một đoạn văn bản mẫu. Ant Design cung cấp nhiều component typography
            giúp tạo ra giao diện đẹp và nhất quán.
          </Paragraph>
          
          <Paragraph type="secondary">
            Text secondary với màu sắc khác biệt.
          </Paragraph>
          
          <Text mark>Highlighted text</Text> | <Text code>Code text</Text> | <Text keyboard>Ctrl+C</Text>
          
          <Paragraph copyable>
            Đoạn text này có thể copy được.
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
}