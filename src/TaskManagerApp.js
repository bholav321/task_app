import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Modal,
  Navbar,
  Alert,
  Table,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import { FaEdit, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";

const TaskManagerApp = () => {
  const loadData = () => {
    const savedData = localStorage.getItem("taskData");
    return savedData ? JSON.parse(savedData) : [];
  };

  const [tasks, setTasks] = useState(loadData());
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newTask, setNewTask] = useState({
    date: "",
    workstation: "",
    issueType: "hardware",
    issueDescription: "",
    resolutionRemark: "",
    issueStatus: "Pending",
    taskCompletedDate: "",
    taskDuration: "",
    locationType: "Skyline",
    siteType: "Visit",
    receivedFrom: "",
    confirmedTo: "",
    inTime: "",
    outTime: "",
    totalHours: "",
  });
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    localStorage.setItem("taskData", JSON.stringify(tasks));
  }, [tasks]);

  const calculateTotalHours = (inTime, outTime) => {
    if (!inTime || !outTime) return "";

    const inTimeParts = inTime.split(":");
    const outTimeParts = outTime.split(":");

    const inMinutes = parseInt(inTimeParts[0]) * 60 + parseInt(inTimeParts[1]);
    const outMinutes =
      parseInt(outTimeParts[0]) * 60 + parseInt(outTimeParts[1]);

    if (outMinutes <= inMinutes) return "";

    const diffMinutes = outMinutes - inMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const validate = () => {
    const errors = {};
    if (!newTask.date.trim()) errors.date = "Date is required.";

    if (newTask.taskCompletedDate && newTask.date) {
      if (new Date(newTask.taskCompletedDate) < new Date(newTask.date)) {
        errors.taskCompletedDate =
          "Completed date cannot be before start date.";
      }
    }

    if (
      !newTask.workstation.trim() ||
      !/^[a-zA-Z0-9 ]+$/.test(newTask.workstation)
    ) {
      errors.workstation =
        "Workstation must contain only alphanumeric characters.";
    }

    if (!newTask.resolutionRemark.trim()) {
      errors.resolutionRemark = "Resolution Remark is required.";
    }

    if (!newTask.taskCompletedDate.trim()) {
      errors.taskCompletedDate = "Task Completed Date is required.";
    }

    if (!newTask.receivedFrom.trim()) {
      errors.receivedFrom = "Received From is required.";
    }

    if (!newTask.confirmedTo.trim()) {
      errors.confirmedTo = "Confirmed To is required.";
    }

    if (!newTask.inTime.trim()) {
      errors.inTime = "In Time is required.";
    }

    if (!newTask.outTime.trim()) {
      errors.outTime = "Out Time is required.";
    } else if (newTask.inTime && newTask.outTime) {
      const totalHours = calculateTotalHours(newTask.inTime, newTask.outTime);
      if (!totalHours) {
        errors.outTime = "Out Time must be after In Time";
      }
    }

    if (!newTask.taskDuration.trim()) {
      errors.taskDuration = "Task Duration is required.";
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTask.taskDuration)) {
      errors.taskDuration = "Duration must be in HH:mm format (e.g., 02:30)";
    }

    if (!newTask.locationType.trim()) {
      errors.locationType = "Location Type is required.";
    }

    if (!newTask.siteType.trim()) {
      errors.siteType = "Site Type is required.";
    }

    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTask = () => {
    if (!validate()) return;

    const totalHours = calculateTotalHours(newTask.inTime, newTask.outTime);
    const taskToSave = {
      ...newTask,
      totalHours,
      issueStatus: newTask.issueStatus || "Pending",
    };

    if (isEditing) {
      const updatedTasks = [...tasks];
      updatedTasks[editingIndex] = taskToSave;
      setTasks(updatedTasks);
      setIsEditing(false);
      setEditingIndex(null);

      Swal.fire({
        title: "Success",
        text: "Task updated successfully",
        icon: "success",
      });
    } else {
      setTasks((prevTasks) => [...prevTasks, taskToSave]);

      Swal.fire({
        title: "Success",
        text: "Task added successfully",
        icon: "success",
      });
    }

    setShowModal(false);
    setNewTask({
      date: "",
      workstation: "",
      issueType: "hardware",
      issueDescription: "",
      resolutionRemark: "",
      issueStatus: "Pending",
      taskCompletedDate: "",
      taskDuration: "",
      locationType: "Skyline",
      siteType: "Visit",
      receivedFrom: "",
      confirmedTo: "",
      inTime: "",
      outTime: "",
      totalHours: "",
    });
    setError({});
  };

  const handleEditTask = (index) => {
    setNewTask(tasks[index]);
    setIsEditing(true);
    setEditingIndex(index);
    setShowModal(true);
  };

  const handleDeleteTask = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setTasks(tasks.filter((_, i) => i !== index));
        Swal.fire("Deleted!", "Your task has been deleted.", "success");
      }
    });
  };

  const handleRowSelect = (e, index) => {
    const selected = e.target.checked;
    if (selected) {
      setSelectedRows([...selectedRows, index]);
    } else {
      setSelectedRows(selectedRows.filter((i) => i !== index));
    }
  };

  const downloadExcel = () => {
    const dataToDownload =
      selectedRows.length > 0
        ? selectedRows.map((index) => tasks[index])
        : tasks;

    if (dataToDownload.length === 0) {
      Swal.fire({
        title: "No Data Available",
        text: "There are no tasks to download.",
        icon: "warning",
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToDownload);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    XLSX.writeFile(workbook, "tasks.xlsx");
    setSelectedRows([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // Automatically calculate total hours when in time or out time changes
      if (name === "inTime" || name === "outTime") {
        if (updated.inTime && updated.outTime) {
          updated.totalHours = calculateTotalHours(
            updated.inTime,
            updated.outTime
          );
        }
      }

      return updated;
    });

    if (error[name]) {
      setError({
        ...error,
        [name]: null,
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError({});
  };

  const styles = {
    formLabel: {
      fontWeight: "bold",
      color: "#333",
    },
    modal: {
      maxWidth: "600px",
      margin: "0 auto",
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    table: {
      marginTop: "1.5rem",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    buttonSpacing: {
      marginRight: "10px",
    },
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container>
          <Navbar.Brand href="#" className="fs-4">
            Task Manager
          </Navbar.Brand>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row className="mb-4">
          <Col>
            <Button
              variant="primary"
              onClick={() => {
                setShowModal(true);
                setIsEditing(false);
                setNewTask({
                  date: "",
                  workstation: "",
                  issueType: "hardware",
                  issueDescription: "",
                  resolutionRemark: "",
                  issueStatus: "Pending",
                  taskCompletedDate: "",
                  taskDuration: "",
                  locationType: "Skyline",
                  siteType: "Visit",
                  receivedFrom: "",
                  confirmedTo: "",
                  inTime: "",
                  outTime: "",
                  totalHours: "",
                });
              }}
              style={styles.buttonSpacing}
            >
              <i className="fas fa-plus"></i> Add Task
            </Button>
            <Button variant="success" onClick={downloadExcel}>
              <i className="fas fa-download"></i> Download{" "}
              {selectedRows.length > 0
                ? `Selected (${selectedRows.length})`
                : "All"}
            </Button>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <div className="container-fluid p-3">
              {" "}
              {/* Added container-fluid and padding */}
              {tasks.length === 0 ? (
                <Alert variant="info">No tasks available</Alert>
              ) : (
                <div className="table-responsive">
                  <Table
                    striped
                    bordered
                    hover
                    responsive="sm"
                    style={{ borderRadius: "8px" }}
                  >
                    <thead className="bg-primary text-white">
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            onChange={(e) =>
                              e.target.checked
                                ? setSelectedRows(tasks.map((_, i) => i))
                                : setSelectedRows([])
                            }
                          />
                        </th>
                        <th>Date</th>
                        <th>Workstation</th>
                        <th>Received From</th>
                        <th>Issue Type</th>
                        <th>Issue Description</th>
                        <th>Resolution Remark</th>
                        <th>Status</th>
                        <th>Completed Date</th>
                        <th>Duration</th>
                        <th>Location Type</th>
                        <th>Site Type</th>
                        <th>Confirmed To</th>
                        <th>In Time</th>
                        <th>Out Time</th>
                        <th>Total Hours</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task, index) => (
                        <tr key={index} className="hover-table-row">
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(index)}
                              onChange={(e) => handleRowSelect(e, index)}
                            />
                          </td>
                          <td>{task.date}</td>
                          <td>{task.workstation}</td>
                          <td>{task.receivedFrom}</td>
                          <td>{task.issueType}</td>
                          <td>{task.issueDescription}</td>
                          <td>{task.resolutionRemark}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                task.issueStatus === "Resolve"
                                  ? "success"
                                  : task.issueStatus === "Reject"
                                  ? "danger"
                                  : "warning"
                              }`}
                            >
                              {task.issueStatus}
                            </span>
                          </td>
                          <td>{task.taskCompletedDate}</td>
                          <td>{task.taskDuration}</td>
                          <td>{task.locationType}</td>
                          <td>{task.siteType}</td>
                          <td>{task.confirmedTo}</td>
                          <td>{task.inTime}</td>
                          <td>{task.outTime}</td>
                          <td>{task.totalHours}</td>
                          <td className="d-flex align-items-center justify-content-start">
                            <Button
                              variant="info"
                              onClick={() => handleEditTask(index)}
                              size="sm"
                              className="me-2 d-flex align-items-center"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleDeleteTask(index)}
                              size="sm"
                              className="d-flex align-items-center"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </Col>
        </Row>

        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>{isEditing ? "Edit Task" : "Add Task"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={newTask.date}
                      onChange={handleInputChange}
                      isInvalid={!!error.date}
                    />
                    <Form.Control.Feedback type="invalid">
                      {error.date}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>
                      Workstation
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="workstation"
                      value={newTask.workstation}
                      onChange={handleInputChange}
                      isInvalid={!!error.workstation}
                      placeholder="Enter workstation name"
                    />
                    <Form.Control.Feedback type="invalid">
                      {error.workstation}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>Issue Type</Form.Label>
                    <Form.Control
                      as="select"
                      name="issueType"
                      value={newTask.issueType}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Network">Network</option>
                    </Form.Control>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>
                      Resolution Remark
                    </Form.Label>
                    <Form.Control
                      name="resolutionRemark"
                      value={newTask.resolutionRemark}
                      onChange={handleInputChange}
                      isInvalid={!!error.resolutionRemark}
                      placeholder="Enter resolution details"
                    />
                    <Form.Control.Feedback type="invalid">
                      {error.resolutionRemark}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>
                      Issue Description
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="issueDescription"
                      value={newTask.issueDescription}
                      onChange={handleInputChange}
                      isInvalid={!!error.issueDescription}
                      placeholder="Describe the issue"
                    />
                    <Form.Control.Feedback type="invalid">
                      {error.issueDescription}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>
                      Received From
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="receivedFrom"
                      value={newTask.receivedFrom}
                      onChange={handleInputChange}
                      isInvalid={!!error.receivedFrom}
                      placeholder="Enter name"
                    />
                    <Form.Control.Feedback type="invalid">
                      {error.receivedFrom}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>
                      Confirmed To
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="confirmedTo"
                      value={newTask.confirmedTo}
                      onChange={handleInputChange}
                      isInvalid={!!error.confirmedTo}
                      placeholder="Enter name"
                    />
                    <Form.Control.Feedback type="invalid">
                      {error.confirmedTo}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>In Time</Form.Label>
                    <Form.Control
                      type="time"
                      name="inTime"
                      value={newTask.inTime}
                      onChange={handleInputChange}
                      isInvalid={!!error.inTime}
                    />
                    <Form.Control.Feedback type="invalid">
                      {error.inTime}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>Out Time</Form.Label>
                    <Form.Control
                      type="time"
                      name="outTime"
                      value={newTask.outTime}
                      onChange={handleInputChange}
                      isInvalid={!!error.outTime}
                    />
                    <Form.Control.Feedback type="invalid">
                      {error.outTime}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>
                      Total Hours
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={newTask.totalHours}
                      disabled
                      placeholder="Auto-calculated"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>Site Type</Form.Label>
                    <Form.Control
                      as="select"
                      name="siteType"
                      value={newTask.siteType}
                      onChange={handleInputChange}
                      className="form-select"
                      isInvalid={!!error.siteType}
                    >
                      <option value="remote">Remote</option>
                      <option value="visit">Visit</option>
                    </Form.Control>
                    <Form.Control.Feedback type="invalid">
                      {error.siteType}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>Status</Form.Label>
                    <Form.Control
                      as="select"
                      name="issueStatus"
                      value={newTask.issueStatus}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Reject">Reject</option>
                      <option value="Resolve">Resolve</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>
                      Task Completed Date
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="taskCompletedDate"
                      value={newTask.taskCompletedDate}
                      onChange={handleInputChange}
                      isInvalid={!!error.taskCompletedDate}
                    />
                    <Form.Control.Feedback type="invalid">
                      {error.taskCompletedDate}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>
                      Task Duration (HH:mm)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="taskDuration"
                      value={newTask.taskDuration}
                      onChange={handleInputChange}
                      isInvalid={!!error.taskDuration}
                      placeholder="Enter duration (e.g., 02:30)"
                    />
                    <Form.Control.Feedback type="invalid">
                      {error.taskDuration}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Label style={styles.formLabel}>
                      Location Type
                    </Form.Label>
                    <Form.Control
                      as="select"
                      name="locationType"
                      value={newTask.locationType}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="Skyline">Skyline</option>
                      <option value="Ab's">Ab's</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSaveTask}>
              {isEditing ? "Update Task" : "Save Task"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default TaskManagerApp;
