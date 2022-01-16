import { React, useState,useCallback,useEffect } from 'react';
import { Form, Input, Button, Select, Table, Modal,Tag, Tooltip,Space,Popconfirm } from "antd";
import { ORGANIZATION_ARCHIVE, WORKSPACE_ARCHIVE } from '../../config/actionTypes';
import axiosInstance from "../../config/axiosConfig";
import { DeleteOutlined ,EditOutlined,ClockCircleOutlined,InfoCircleOutlined,QuestionCircleTwoTone} from '@ant-design/icons';
import cronstrue from 'cronstrue';


const VARIABLES_COLUMS = (organizationId, workspaceId,onEdit) => [
  {
    title: 'Id',
    dataIndex: 'id',
    width: "30%",
    key: 'id',
    render: (_, record) => {
      return  record.id;
    }
  },
  {
    title: 'Job Type',
    dataIndex: 'jobType',
    key: 'jobType',
    width: "10%",
    render: (_, record) => {
      return record.name;
    }
  },
  {
    title: 'Schedule',
    dataIndex: 'cron',
    key: 'cron',
    width: "30%",
    render: (_, record) => {
      return <span><Tag color="default">cron: {record.cron} </Tag> 
      <Tag icon={<InfoCircleOutlined />} color="default">{cronstrue.toString(record.cron)}</Tag>
     
      </span>;
      
    }
  },
  {
    title: 'Actions',
    key: 'action',
    render: (_, record) => {
      return <div>
        <Button  type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>Edit</Button>
        <Popconfirm  onConfirm={() => {deleteSchedule(record.id, organizationId, workspaceId)}} title={<p>This will permanently delete this schedule <br/>
          Are you sure?</p>} okText="Yes" cancelText="No"> <Button danger type="link" icon={<DeleteOutlined />}>Delete</Button></Popconfirm>
      </div>
    }
  }
]

const validateMessages = {
  required: '${label} is required!',
  pattern: '${label} is not valid cron expression!',
}



export const Schedules = ({ schedules }) => {
  const workspaceId = localStorage.getItem(WORKSPACE_ARCHIVE);
  const organizationId = localStorage.getItem(ORGANIZATION_ARCHIVE);
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("create");
  const [scheduleId, setScheduleId] = useState("");
  const [templates, setTemplates] = useState([]);
 

  useEffect(() => {
    setLoading(true);
    loadTemplates();

  }, [organizationId]);

  const loadTemplates = () => {
    axiosInstance.get(`organization/${organizationId}/template`)
      .then(response => {
        console.log(response);
        setTemplates(response.data);
        setLoading(false);
      });
  }

  const onCancel = () => {
    setVisible(false);
  };
  const onEdit = (schedule) => {
    setMode("edit")
    setScheduleId(schedule.id);
    form.setFieldsValue({tcl:schedule.tcl,cron:schedule.cron});
    setVisible(true);
  };

  const onCreate = (values) => {
    const body = {
      data: {
        type: "schedule",
        attributes: {
          tcl: values.tcl,
          cron: values.cron
        }
      }
    }
    console.log(body);

    axiosInstance.post(`organization/${organizationId}/workspace/${workspaceId}/schedule`, body, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    })
      .then(response => {
        console.log(response);
        setVisible(false);
        form.resetFields();
      });
  };


  const onUpdate = (values) => {
    const body = {
      data: {
        type: "schedule",
        id: scheduleId,
        attributes: {
          tcl: values.tcl,
          cron: values.cron
        }
      }
    }
    console.log(body);

    axiosInstance.patch(`organization/${organizationId}/workspace/${workspaceId}/schedule/${scheduleId}`, body, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    })
      .then(response => {
        console.log(response);
        setVisible(false);
        form.resetFields();
      });
  };

  return (
    <div>
      <h2>Schedules</h2>
      <div className="App-text">Schedules allows you to automatically trigger a Job in your workspace on a scheduled basis.</div>
      <Table dataSource={schedules} columns={VARIABLES_COLUMS(organizationId, workspaceId,onEdit)} rowKey='key' />
      <Button type="primary"  icon={<ClockCircleOutlined />} htmlType="button"
        onClick={() => {
          setMode("create");
          form.resetFields();
          setVisible(true);
        }}>
        Add schedule
      </Button>
  
      <Modal width="600px" visible={visible} title={mode === "edit" ? "Edit schedule" : "Create new schedule"} okText="Save schedule" cancelText="Cancel" onCancel={onCancel}
        onOk={() => {
          form.validateFields().then((values) => {
            if(mode === "create")
               onCreate(values);
            else
               onUpdate(values);
          }).catch((info) => {
            console.log('Validate Failed:', info);
          });
        }}>
        <Space style={{ width: "100%" }} direction="vertical">
          <Form name="create-org" form={form} layout="vertical" validateMessages={validateMessages}>
            <Form.Item name="tcl" label="Job Type" rules={[{ required: true }]} tooltip={{ title: 'Job to trigger in a scheduled basis', icon: <InfoCircleOutlined /> }} >
            {loading || !templates.data ? (
            <p>Data loading...</p>
          ) : ( <Select >
             {templates.data.map((item) => (
                 <Select.Option value={item.attributes.tcl}>{item.attributes.name}</Select.Option>
             ))}
            </Select>)}
            </Form.Item>
            <Form.Item name="cron" rules={[{ required: true,pattern:"" }]}  label="Cron" tooltip={{ title: 'A cron expression is a string consisting of six or seven subexpressions (fields) that describe individual details of the schedule.', icon: <InfoCircleOutlined /> }} >
              <Input />
              
         
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </div>
  )
}


const deleteSchedule = (scheduleId, organizationId, workspaceId)  =>{
  console.log(scheduleId);

  axiosInstance.delete(`organization/${organizationId}/workspace/${workspaceId}/schedule/${scheduleId}`, {
    headers: {
      'Content-Type': 'application/vnd.api+json'
    }
  })
    .then(response => {
      console.log(response);
    })
}