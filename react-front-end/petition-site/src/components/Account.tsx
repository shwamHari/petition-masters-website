import axios from 'axios';
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Paper,
    IconButton,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    InputAdornment,
    FormControl,
    InputLabel,
    OutlinedInput
} from "@mui/material";
import CSS from "csstype";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from "@mui/icons-material/Edit";
import { useUserStore } from "../store";
import DeleteIcon from "@mui/icons-material/Delete";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

interface User {
    email: string;
    firstName: string;
    lastName: string;
}

const Account = () => {
    const user = useUserStore(state => state.user);
    const setUser = useUserStore(state => state.setUser);
    const [userInfo, setUserInfo] = useState<User>({
        email: "",
        firstName: "",
        lastName: ""
    });

    const [errorFlag, setErrorFlag] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [openNewNameDialog, setOpenNewNameDialog] = useState(false);
    const [newFirstName, setNewFirstName] = useState("");
    const [newLastName, setNewLastName] = useState("");

    const [openNewEmailDialog, setOpenNewEmailDialog] = useState(false);
    const [newEmail, setNewEmail] = useState("");

    const [openChangePasswordDialog, setOpenChangePasswordDialog] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [openRemoveImageDialog, setOpenRemoveImageDialog] = useState(false);
    const [openUploadImageDialog, setOpenUploadImageDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const handleNewNameSubmit = () => {
        axios.patch(`http://localhost:4941/api/v1/users/${user.userId}`, {
            firstName: newFirstName,
            lastName: newLastName
        }, {
            headers: { "X-Authorization": user.token }
        })
            .then(response => {
                setUserInfo({
                    ...userInfo,
                    firstName: newFirstName,
                    lastName: newLastName
                });
                setOpenNewNameDialog(false);
            })
            .catch(error => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };

    const handleNewEmailSubmit = () => {
        axios.patch(`http://localhost:4941/api/v1/users/${user.userId}`, {
            email: newEmail
        }, {
            headers: { "X-Authorization": user.token }
        })
            .then(response => {
                setUserInfo({
                    ...userInfo,
                    email: newEmail
                });
                setOpenNewEmailDialog(false);
            })
            .catch(error => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };

    const handleChangePasswordSubmit = () => {
        axios.patch(`http://localhost:4941/api/v1/users/${user.userId}`, {
            currentPassword: oldPassword,
            password: newPassword
        }, {
            headers: { "X-Authorization": user.token }
        })
            .then(response => {
                setOpenChangePasswordDialog(false);
            })
            .catch(error => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };

    useEffect(() => {
        const getUser = () => {
            axios.get(`http://localhost:4941/api/v1/users/${user.userId}`, {
                headers: { "X-Authorization": user.token }
            })
                .then(response => {
                    setUserInfo(response.data);
                    setErrorFlag(false);
                    setErrorMessage("");
                })
                .catch(error => {
                    setErrorFlag(true);
                    setErrorMessage(error.toString());
                });
        };

        getUser();
    }, [user.userId]);

    const handleNewNameDialogOpen = () => {
        setNewFirstName(userInfo.firstName);
        setNewLastName(userInfo.lastName);
        setOpenNewNameDialog(true);
    };

    const handleNewNameDialogClose = () => {
        setOpenNewNameDialog(false);
    };

    const handleNewEmailDialogOpen = () => {
        setNewEmail(userInfo.email);
        setOpenNewEmailDialog(true);
    };

    const handleNewEmailDialogClose = () => {
        setOpenNewEmailDialog(false);
    };

    const handleChangePasswordDialogOpen = () => {
        setOpenChangePasswordDialog(true);
    };

    const handleChangePasswordDialogClose = () => {
        setNewPassword("")
        setOldPassword("")
        setShowNewPassword(false)
        setShowOldPassword(false)
        setOpenChangePasswordDialog(false);
    };

    const handleNewFirstNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewFirstName(event.target.value);
    };

    const handleNewLastNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewLastName(event.target.value);
    };

    const handleNewEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewEmail(event.target.value);
    };

    const handleOldPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOldPassword(event.target.value);
    };

    const handleNewPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPassword(event.target.value);
    };

    const handleRemoveImageDialogOpen = () => {
        setOpenRemoveImageDialog(true);
    };

    const handleRemoveImageDialogClose = () => {
        setOpenRemoveImageDialog(false);
    };

    const handleRemoveImageConfirm = () => {
        const deleteUserImage = () => {
            axios.delete(`http://localhost:4941/api/v1/users/${user.userId}/image`, {
                headers: { "X-Authorization": user.token }
            })
                .then(response => {
                    setErrorFlag(false);
                    setErrorMessage("");
                    setOpenRemoveImageDialog(false);
                    window.location.reload();
                })
                .catch(error => {
                    setErrorFlag(true);
                    setErrorMessage(error.toString());
                });
        };
        deleteUserImage();
    };

    const handleUploadImageDialogOpen = () => {
        setOpenUploadImageDialog(true);
    };

    const handleUploadImageDialogClose = () => {
        setOpenUploadImageDialog(false);
        setSelectedImage(null);
        setImagePreviewUrl(null);
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedImage(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadImageSubmit = () => {
        if (!selectedImage) return;


        axios.put(`http://localhost:4941/api/v1/users/${user.userId}/image`, selectedImage, {
            headers: {
                "X-Authorization": user.token,
                "Content-Type": selectedImage.type
            }
        })
            .then(response => {
                setOpenUploadImageDialog(false);
                setSelectedImage(null);
                setImagePreviewUrl(null);
                // Optionally reload user info to update the image
                window.location.reload()
            })
            .catch(error => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };

    const toggleShowOldPassword = () => {
        setShowOldPassword(!showOldPassword);
    };

    const toggleShowNewPassword = () => {
        setShowNewPassword(!showNewPassword);
    };

    const card: CSS.Properties = {
        padding: "10px",
        marginTop: "50px",
        marginLeft: "300px",
        marginRight: "300px",
        display: "block",
        background: "aliceblue",
        fontFamily: "Roboto Slab",
        fontSize: "larger"
    };

    const defaultOwnerImage = "https://png.pngitem.com/pimgs/s/150-1503945_transparent-user-png-default-user-image-png-png.png";

    return (
        <Paper elevation={10} style={card}>

            <IconButton aria-label="home"
                        style={{ color: "black", position: "absolute", top: 40, left: 40 }}>
                <Link to={"/petitions"}><ArrowBackIcon fontSize={"large"} />Back</Link>
            </IconButton>

            <h2 style={{ textAlign: "center", fontSize: "4rem" , fontWeight: 300}}>Your Account</h2>

            <img
                src={`http://localhost:4941/api/v1/users/${user.userId}/image`}
                alt="User"
                onError={(e) => {
                    e.currentTarget.src = defaultOwnerImage;
                }}
                style={{ height: 300, marginTop: 30 }}
            />

            <div>
                <IconButton aria-label="edit" style={{ color: "black", marginBottom: 30, fontWeight:300 }} onClick={handleUploadImageDialogOpen}>
                    Change Image<EditIcon />
                </IconButton>
                <IconButton aria-label="edit" style={{ color: "black", marginBottom: 30, fontWeight:300 }} onClick={handleRemoveImageDialogOpen}>
                    Remove Image<DeleteIcon />
                </IconButton>
            </div>

            <h3 style={{fontWeight:400}}>{`Name: ${userInfo.firstName} ${userInfo.lastName}`}
                <IconButton aria-label="edit" style={{ color: "black", fontWeight:300 }} onClick={handleNewNameDialogOpen}>
                    <EditIcon />
                </IconButton>
            </h3>
            <h3 style={{fontWeight:400}}>Email: {userInfo.email}
                <IconButton aria-label="edit" style={{ color: "black", fontWeight:300 }} onClick={handleNewEmailDialogOpen}>
                    <EditIcon />
                </IconButton>
            </h3>
            <IconButton aria-label="edit" style={{ color: "black", marginTop: 10, fontWeight:300}} onClick={handleChangePasswordDialogOpen}>
                Change Password<EditIcon />
            </IconButton>

            <Dialog open={openNewNameDialog} onClose={handleNewNameDialogClose}>
                <DialogTitle>Edit Name</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your new first and last name.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="firstName"
                        label="First Name"
                        type="text"
                        fullWidth
                        value={newFirstName}
                        onChange={handleNewFirstNameChange}
                    />
                    <TextField
                        margin="dense"
                        name="lastName"
                        label="Last Name"
                        type="text"
                        fullWidth
                        value={newLastName}
                        onChange={handleNewLastNameChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleNewNameDialogClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleNewNameSubmit} color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openNewEmailDialog} onClose={handleNewEmailDialogClose}>
                <DialogTitle>Edit Email</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your new email address.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="email"
                        label="Email"
                        type="email"
                        fullWidth
                        value={newEmail}
                        onChange={handleNewEmailChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleNewEmailDialogClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleNewEmailSubmit} color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openChangePasswordDialog} onClose={handleChangePasswordDialogClose}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your old and new passwords.
                    </DialogContentText>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel htmlFor="outlined-adornment-old-password">Old Password</InputLabel>
                        <OutlinedInput
                            id="outlined-adornment-old-password"
                            type={showOldPassword ? 'text' : 'password'}
                            value={oldPassword}
                            onChange={handleOldPasswordChange}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle old password visibility"
                                        onClick={toggleShowOldPassword}
                                        edge="end"
                                    >
                                        {showOldPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            }
                            label="Old Password"
                        />
                    </FormControl>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel htmlFor="outlined-adornment-new-password">New Password</InputLabel>
                        <OutlinedInput
                            id="outlined-adornment-new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={handleNewPasswordChange}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle new password visibility"
                                        onClick={toggleShowNewPassword}
                                        edge="end"
                                    >
                                        {showNewPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            }
                            label="New Password"
                        />
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleChangePasswordDialogClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleChangePasswordSubmit} color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openRemoveImageDialog} onClose={handleRemoveImageDialogClose}>
                <DialogTitle>Remove Image</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to remove the image?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRemoveImageDialogClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleRemoveImageConfirm} color="primary">
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openUploadImageDialog} onClose={handleUploadImageDialogClose}>
                <DialogTitle>Upload Image</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please select an image to upload.
                    </DialogContentText>
                    <input
                        accept="image/*"
                        type="file"
                        onChange={handleImageChange}
                    />
                    {imagePreviewUrl && (
                        <img src={imagePreviewUrl} alt="Image Preview" style={{ width: '100%', marginTop: 20 }} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUploadImageDialogClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleUploadImageSubmit} color="primary" disabled={!selectedImage}>
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>

        </Paper>
    );
};

export default Account;
