import React, {useEffect, useState} from "react";
import {
    Paper,
    AlertTitle,
    Alert,
    TextField,
    Checkbox,
    ListItemText,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    SelectChangeEvent,
    IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, FormControlLabel
} from "@mui/material";
import axios from 'axios';
import PetitionListObject from "./PetitionListObject";
import {Link} from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from '@mui/icons-material/Logout';
import AddBoxIcon from '@mui/icons-material/AddBox';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

import {useUserStore} from "../store";
import CSS from "csstype";
import petitionMastersImage from '../images/petitionMasters.png';



interface Category {
    categoryId: number;
    name: string;
}

interface SupportTier {
    title: string;
    description: string;
    cost: number;
}

const categoriesData: Category[] = [
    {"categoryId":3,"name":"Animal Rights"},
    {"categoryId":8,"name":"Arts and Culture"},
    {"categoryId":9,"name":"Community Development"},
    {"categoryId":10,"name":"Economic Empowerment"},
    {"categoryId":5,"name":"Education"},
    {"categoryId":2,"name":"Environmental Causes"},
    {"categoryId":4,"name":"Health and Wellness"},
    {"categoryId":6,"name":"Human Rights"},
    {"categoryId":11,"name":"Science and Research"},
    {"categoryId":12,"name":"Sports and Recreation"},
    {"categoryId":7,"name":"Technology and Innovation"},
    {"categoryId":1,"name":"Wildlife"}
];

const sortOptions = [
    { label: 'Oldest-Newest (default)', value: 'CREATED_ASC' },
    { label: 'Newest-Oldest', value: 'CREATED_DESC' },
    { label: 'Alphabetical', value: 'ALPHABETICAL_ASC' },
    { label: 'Reverse Alphabetical', value: 'ALPHABETICAL_DESC' },
    { label: 'Cost Ascending', value: 'COST_ASC' },
    { label: 'Cost Descending', value: 'COST_DESC' }
];

const PetitionList = () => {
    const [newPetitionImageUrl, setNewPetitionImageUrl] = React.useState<string | null>(null);
    const [newUserImageUrl, setNewUserImageUrl] = React.useState<string | null>(null);
    const [newUserImage, setNewUserImage] = React.useState<File | null>(null);


    const [petitions, setPetitions] = React.useState<Petition[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [maxSupportingCost, setMaxSupportingCost] = React.useState(Infinity);
    const [sortBy, setSortBy] = React.useState<string>('CREATED_ASC');

    const [fullParams, setFullParams] = React.useState("");
    const [selectedCategories, setSelectedCategories] = React.useState<number[]>([]);

    const user = useUserStore(state => state.user)
    const setUser = useUserStore(state => state.setUser)

    const [loginPassword, setLoginPassword] = React.useState("")
    const [loginEmail, setLoginEmail] = React.useState("")
    const [openLoginDialog, setOpenLoginDialog] = React.useState(false)

    const [registerFirstName, setRegisterFirstName] = React.useState("")
    const [registerLastName, setRegisterLastName] = React.useState("")

    const [showPassword, setShowPassword] = React.useState(false);

    const [registerPassword, setRegisterPassword] = React.useState("")
    const [registerEmail, setRegisterEmail] = React.useState("")
    const [openRegisterDialog, setOpenRegisterDialog] = React.useState(false)

    const [errorFlag, setErrorFlag] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState("");

    const [openCreateDialog, setOpenCreateDialog] = React.useState(false);

    const [newPetitionTitle, setNewPetitionTitle] = React.useState("");
    const [newPetitionDescription, setNewPetitionDescription] = React.useState("");
    const [newPetitionCategory, setNewPetitionCategory] = React.useState<number | "">("");
    const [newPetitionSupportTiers, setNewPetitionSupportTiers] = React.useState<SupportTier[]>([{ title: "", description: "", cost: 0 }]);
    const [newPetitionImage, setNewPetitionImage] = React.useState<File | null>(null);

    const [selectedOption, setSelectedOption] = React.useState('');

    const [registered, setRegistered] = React.useState(false);

    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);
    const [totalPetitions, setTotalPetitions] = React.useState(0);

    const [openUploadImageDialog, setOpenUploadImageDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);




    const LoginUser = (email: string, password: string) => {
        axios.post(`http://localhost:4941/api/v1/users/login`, {"email": email, "password": password})
            .then((response) => {
                setErrorFlag(false);
                setErrorMessage("");
                setUser(response.data);
                handleLoginDialogClose();
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    }

    const RegisterUser = (firstName: string, lastName: string, email: string, password: string) => {
        axios.post(`http://localhost:4941/api/v1/users/register`, {"firstName": firstName, "lastName": lastName, "email": email, "password": password})
            .then( (response) => {
                LoginUser(email, password);

                handleRegisterDialogClose()
                handleUploadImageDialogOpen()


                setErrorFlag(false);
                setErrorMessage("");
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    }

    const LogoutUser = () => {
        axios.post('http://localhost:4941/api/v1/users/logout', {}, {
            headers: {"X-Authorization": user.token}
        })
            .then((response) => {
                setErrorFlag(false);
                setErrorMessage("");
                setUser({token: '', userId: 0});
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    }

    const handleLoginDialogOpen = () => {
        setOpenLoginDialog(true);
    };

    const handleLoginDialogClose = () => {
        setLoginEmail("")
        setLoginPassword("")
        setOpenLoginDialog(false);
    };

    const handleRegisterDialogOpen = () => {
        setOpenRegisterDialog(true);
    };

    const handleRegisterDialogClose = () => {
        setRegisterEmail("")
        setRegisterPassword("")
        setRegisterFirstName("")
        setRegisterLastName("")
        setOpenRegisterDialog(false);
    };

    const switchToLogin = () => {
        setErrorFlag(false)
        setErrorMessage("")
        handleRegisterDialogClose();
        handleLoginDialogOpen();
    };

    const switchToRegister = () => {
        setErrorFlag(false)
        setErrorMessage("")
        handleLoginDialogClose();
        handleRegisterDialogOpen();
    };

    const updateLoginEmailState = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLoginEmail(event.target.value);
    }

    const updateLoginPasswordState = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLoginPassword(event.target.value);
    }

    const updateRegisterFirstNameState = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterFirstName(event.target.value);
    }

    const updateRegisterLastNameState = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterLastName(event.target.value);
    }

    const updateRegisterEmailState = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterEmail(event.target.value);
    }

    const updateRegisterPasswordState = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterPassword(event.target.value);
    }

    const formParams = () => {
        let newParams = "";
        if (searchQuery !== "") {
            newParams += "&q=" + searchQuery;
        }
        if (maxSupportingCost !== Infinity) {
            newParams += "&supportingCost=" + maxSupportingCost;
        }
        if (selectedCategories.length !== 0) {
            for (const id of selectedCategories) {
                newParams += "&categoryIds=" + id;
            }
        }
        if (sortBy !== '') {
            newParams += "&sortBy=" + sortBy;
        }

        if (selectedOption) {
            if (selectedOption === "own"){
                newParams += "&ownerId=" + user.userId;
            } else {
                newParams += "&supporterId=" + user.userId;
            }
        }

        const startIndex = (currentPage - 1) * pageSize;

        newParams += `&startIndex=${startIndex}&count=${pageSize}`


        setFullParams(newParams);
    };

    React.useEffect(() => {
        formParams();
    }, [searchQuery, maxSupportingCost, selectedCategories, sortBy, selectedOption, currentPage]);

    React.useEffect(() => {
        const getPetitions = () => {
            axios.get(`http://localhost:4941/api/v1/petitions?${fullParams}`)
                .then((response) => {
                    setErrorFlag(false);
                    setErrorMessage("");
                    setPetitions(response.data.petitions);
                    setTotalPetitions(response.data.count);

                })
                .catch((error) => {
                    setErrorFlag(true);
                    setErrorMessage(error.response.data.message);
                });
        };
        getPetitions();
    }, [fullParams]);


    useEffect(() => {
        const scrollToTop = () => {
            window.scrollTo({
                top: 500,
                behavior: "smooth" // Optional: adds smooth scrolling behavior
            });
        };

        scrollToTop();
    }, [currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        formParams();
    };

    const totalPages = Math.ceil(totalPetitions / pageSize);

    React.useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [petitions, totalPages, currentPage]);


    const paginationButtons = [];
    for (let i = 1; i <= totalPages; i++) {
        paginationButtons.push(
            <Button key={i} onClick={() => handlePageChange(i)}
                    disabled={currentPage === i}
                    style={{ minWidth: '60px', minHeight: '60px', fontSize: '1.6em', margin: '5px' }}

            >
                {i}
            </Button>
        );
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value;
        setSearchQuery(query.trim());
    };

    const handleSupportingCostChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setMaxSupportingCost(value === "" ? Infinity : parseInt(value));
    };

    const handleCategoryChange = (event: SelectChangeEvent<number[]>) => {
        const selectedValues = event.target.value as number[];
        setSelectedCategories(selectedValues);
    };

    const handleSortByChange = (event: SelectChangeEvent<string>) => {
        setSortBy(event.target.value);
    };

    const handleMyPetitionChange = (event: SelectChangeEvent<string>) => {
        setSelectedOption(event.target.value);
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedImage(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadImageDialogOpen = () => {
        setOpenUploadImageDialog(true);
    };


    const handleUploadImageDialogClose = () => {
        setOpenUploadImageDialog(false);
        setSelectedImage(null);
        setImagePreviewUrl(null);
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
                handleUploadImageDialogClose()
            })
            .catch(error => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };


    const petitions_rows = () => petitions.map((petition: Petition) => <PetitionListObject key={petition.petitionId + petition.title} petition={petition} />);





    const handleCreateDialogOpen = () => {
        setOpenCreateDialog(true);
    };

    const handleCreateDialogClose = () => {
        setNewPetitionImage(null);
        setNewPetitionImageUrl(null);
        setNewPetitionTitle("")
        setNewPetitionDescription("")
        setNewPetitionCategory("")
        setNewPetitionSupportTiers([{ title: "", description: "", cost: 0 }]);
        setOpenCreateDialog(false);
    };

    const handleNewPetitionTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPetitionTitle(event.target.value);
    };

    const handleNewPetitionDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPetitionDescription(event.target.value);
    };

    const handleNewPetitionCategoryChange = (event: SelectChangeEvent<number>) => {
        setNewPetitionCategory(event.target.value as number);
    };

    const handleNewPetitionSupportTierChange = (index: number, field: keyof SupportTier, value: any) => {
        setNewPetitionSupportTiers((prevTiers) => {
            const newTiers = [...prevTiers];
            newTiers[index] = {
                ...newTiers[index],
                [field]: field === 'cost' ? parseInt(value, 10) : value,
            };
            return newTiers;
        });
    };
    const handleAddSupportTier = () => {
        setNewPetitionSupportTiers((prevTiers) => [...prevTiers, { title: "", description: "", cost: 0 }]);
    };

    const handleRemoveSupportTier = (index: number) => {
        setNewPetitionSupportTiers((prevTiers) => prevTiers.filter((_, i) => i !== index));
    };


    const handleNewUserImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setNewUserImage(file);
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setNewUserImageUrl(imageUrl);
            console.log(file)
        } else {
            setNewUserImage(null);
        }
    };

    const handleNewPetitionImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setNewPetitionImage(file);
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setNewPetitionImageUrl(imageUrl);
            console.log(file)
        } else {
            setNewPetitionImageUrl(null);
        }
    };
    React.useEffect(() => {

        const setUserProfileImage = () => {
            if (!newUserImage) {
                setRegistered(false)
                return;
            }

            const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
            const fileType = newUserImage.type;

            if (!allowedImageTypes.includes(fileType)) {
                setErrorFlag(true);
                setErrorMessage("Unsupported file type. Only .png, .jpeg, .jpg, and .gif files are allowed.");
                return;
            }

            console.log(user.token)

            axios.put(`http://localhost:4941/api/v1/users/${user.userId}/image`, newUserImage, {
                headers: {
                    'Content-Type': fileType,
                    'X-Authorization': user.token
                }
            })
                .then((response) => {
                    setErrorFlag(false);
                    setErrorMessage("");
                    handleRegisterDialogClose()
                })
                .catch((error) => {
                    setErrorFlag(true);
                    setErrorMessage(error.toString());
                });
            setRegistered(false)
        };
        setUserProfileImage()
    }, [registered])
    const setHeroImage = (id: number) => {
        if (!newPetitionImage) {
            setErrorFlag(true);
            setErrorMessage("No image selected to set as hero image.");
            return;
        }

        const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
        const fileType = newPetitionImage.type;

        if (!allowedImageTypes.includes(fileType)) {
            setErrorFlag(true);
            setErrorMessage("Unsupported file type. Only .png, .jpeg, .jpg, and .gif files are allowed.");
            return;
        }

        axios.put(`http://localhost:4941/api/v1/petitions/${id}/image`, newPetitionImage, {
            headers: {
                'Content-Type': fileType,
                'X-Authorization': user.token
            }
        })
            .then((response) => {
                setErrorFlag(false);
                setErrorMessage("");
                formParams();
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };
    const handleCreatePetition = () => {
        const requestData = {
            title: newPetitionTitle,
            description: newPetitionDescription,
            categoryId: newPetitionCategory,
            supportTiers: newPetitionSupportTiers.map(tier => ({
                title: tier.title,
                description: tier.description,
                cost: parseInt(String(tier.cost))
            }))
        };

        axios.post('http://localhost:4941/api/v1/petitions', requestData, {

            headers: {
                'X-Authorization': user.token,
            },
        })
            .then((response) => {
                console.log(requestData)

                if (newPetitionImage) {
                    setHeroImage(response.data.petitionId)
                }
                setErrorFlag(false);
                setErrorMessage("");
                handleCreateDialogClose()
                window.location.reload();
            })
            .catch((error) => {
                console.log(requestData)

                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };

    const card = {
        padding: "10px",
        margin: "30px",
        display: "block",
        background: "aliceblue",
        fontFamily: "Roboto Slab"
    };

    const defaultOwnerImage = "https://png.pngitem.com/pimgs/s/150-1503945_transparent-user-png-default-user-image-png-png.png";

    return (
        <>
            <Paper style={card}>

                <div>
                    <div style={{position: "relative"}}>
                        <img src={petitionMastersImage} alt="Petition Masters Image"
                             style={{height: 350, marginTop: 20, marginBottom: 50}}/>
                        {user.token ? (
                            <div style={{position: "absolute", top: 20, right: 30}}>
                                <Link to="/account" style={{textDecoration: "none"}}>
                                    <IconButton color="inherit">
                                        <p style={{fontSize: "2rem", fontWeight: 300}}>Manage Account</p><ManageAccountsIcon
                                        fontSize={"large"}/>
                                    </IconButton>
                                </Link>
                                <div style={{marginTop: 10}}>
                                    <IconButton color="inherit" onClick={LogoutUser}>
                                        <p style={{fontSize: "2rem", fontWeight: 300}}>Logout</p><LogoutIcon
                                        fontSize={"large"}/>
                                    </IconButton>
                                </div>
                            </div>
                        ) : (
                            <div style={{position: "absolute", top: 20, right: 30}}>
                                <IconButton color="inherit" onClick={handleLoginDialogOpen}>
                                    <p style={{fontSize: "2rem", fontWeight: 300}}>Sign in</p><LoginIcon
                                    fontSize={"large"}/>
                                </IconButton>
                            </div>
                        )}

                    </div>
                </div>


                {errorFlag && (
                    <Alert severity="error">
                        <AlertTitle>Error</AlertTitle>
                        {errorMessage}
                    </Alert>
                )}

                <TextField
                    label="Search"
                    variant="outlined"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{marginBottom: 20, width: "50%"}}
                />
                <div style={{marginBottom: '20px'}}>
                    <TextField
                        label="Max Supporting Cost"
                        variant="outlined"
                        type="number"
                        value={maxSupportingCost === Infinity ? '' : maxSupportingCost}
                        onChange={handleSupportingCostChange}
                        style={{marginRight: '10px'}}
                    />
                    <FormControl variant="outlined" style={{minWidth: 200, maxWidth: 200, marginRight: '10px'}}>
                        <InputLabel>Categories</InputLabel>
                        <Select
                            multiple
                            value={selectedCategories}
                            onChange={handleCategoryChange}
                            renderValue={(selected) => (
                                <div style={{display: 'flex', flexWrap: 'wrap'}}>
                                    {selected.map((value) => (
                                        <Chip key={value}
                                              label={categoriesData.find(cat => cat.categoryId === value)?.name}
                                              style={{margin: 2}}/>
                                    ))}
                                </div>
                            )}
                        >
                            {categoriesData.map((category) => (
                                <MenuItem key={category.categoryId} value={category.categoryId}>
                                    <Checkbox checked={selectedCategories.indexOf(category.categoryId) > -1}/>
                                    <ListItemText primary={category.name}/>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl variant="outlined" style={{minWidth: 200}}>
                        <InputLabel>Sort By</InputLabel>
                        <Select value={sortBy} onChange={handleSortByChange} label="Sort By">
                            {sortOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {user.token && (
                        <FormControl style={{minWidth: 200, marginLeft: 10}}>
                            <InputLabel id="petition-select-label">My Petition Options</InputLabel>
                            <Select
                                labelId="petition-select-label"
                                value={selectedOption}
                                onChange={handleMyPetitionChange}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                <MenuItem value="own">Petitions I Own</MenuItem>
                                <MenuItem value="support">Petitions I Support</MenuItem>
                            </Select>
                        </FormControl>
                    )}

                </div>

                <div>
                    {paginationButtons}
                </div>
                <div>{petitions_rows()}</div>
                <div>
                    {paginationButtons}
                </div>

                {user.token && user.token !== "" ?
                    <>
                        <IconButton aria-label="create-petition" onClick={handleCreateDialogOpen}
                                    style={{fontSize: 40}}>
                            <AddBoxIcon fontSize={"large"}/>Create new petition
                        </IconButton>
                    </>
                    :

                    <h3>Sign in to create a petition</h3>
                }
            </Paper>

            <Dialog open={openLoginDialog} onClose={handleLoginDialogClose}>
                {errorFlag && (
                    <Alert severity="error">
                        <AlertTitle>Error</AlertTitle>
                        {errorMessage}
                        <p>
                            invalid email and/or password
                        </p>
                    </Alert>
                )}
                <DialogTitle>Login
                    <IconButton onClick={switchToRegister}
                                style={{position: 'absolute', top: '10px', right: '10px', fontSize: "medium"}}>
                        Not registered?<ArrowForwardIcon/>
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your email and password to login.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={loginEmail}
                        onChange={updateLoginEmailState}
                    />
                    <TextField
                        margin="dense"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        fullWidth
                        variant="outlined"
                        value={loginPassword}
                        onChange={updateLoginPasswordState}
                        InputProps={{
                            endAdornment: (
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            )
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleLoginDialogClose}>Cancel</Button>
                    <Button onClick={() => LoginUser(loginEmail, loginPassword)}>Login</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openRegisterDialog} onClose={handleRegisterDialogClose}>
                {errorFlag && (
                    <Alert severity="error">
                        <AlertTitle>Error</AlertTitle>
                        {errorMessage}
                        <p style={{whiteSpace: "pre-line"}}>
                            {"Invalid inputs. Please enter a value for each field including: \n-a unique, valid email \n-a password of at least 6 characters"}
                        </p>

                    </Alert>
                )}

                <DialogTitle>Register
                    <IconButton onClick={switchToLogin}
                                style={{position: 'absolute', top: '10px', right: '10px', fontSize: "medium" }}>
                        Back to login<ArrowBackIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please fill in the form to register.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="First Name"
                        fullWidth
                        variant="outlined"
                        value={registerFirstName}
                        onChange={updateRegisterFirstNameState}
                    />
                    <TextField
                        margin="dense"
                        label="Last Name"
                        fullWidth
                        variant="outlined"
                        value={registerLastName}
                        onChange={updateRegisterLastNameState}
                    />
                    <TextField
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={registerEmail}
                        onChange={updateRegisterEmailState}
                    />
                    <TextField
                        margin="dense"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        fullWidth
                        variant="outlined"
                        value={registerPassword}
                        onChange={updateRegisterPasswordState}
                        InputProps={{
                            endAdornment: (
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            )
                        }}
                    />
                    {/*<input*/}
                    {/*    accept="image/*"*/}
                    {/*    style={{ display: 'none' }}*/}
                    {/*    id="raised-button-file"*/}
                    {/*    type="file"*/}
                    {/*    onChange={handleNewUserImageChange}*/}
                    {/*/>*/}
                    {/*<label htmlFor="raised-button-file">*/}
                    {/*    <Button variant="contained" component="span">*/}
                    {/*        Upload Profile Picture(optional)*/}
                    {/*    </Button>*/}
                    {/*</label>*/}
                    {/*{newUserImageUrl && (*/}
                    {/*    <div>*/}
                    {/*        <img src={newUserImageUrl} alt="Selected Image" style={{ maxWidth: '100%', maxHeight: '300px' }} />*/}
                    {/*    </div>*/}
                    {/*)}*/}

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRegisterDialogClose}>Cancel</Button>
                    <Button onClick={() => RegisterUser(registerFirstName, registerLastName, registerEmail, registerPassword)}>Register</Button>
                </DialogActions>
            </Dialog>


            <Dialog open={openCreateDialog} onClose={handleCreateDialogClose}>
                {errorFlag && (
                    <Alert severity="error">
                        <AlertTitle>Error</AlertTitle>
                        {errorMessage}
                        <p>Ensure you have entered values for all fields and have
                            provided an image for the petition.
                        </p>
                    </Alert>
                )}
                <DialogTitle>Create a New Petition</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter the details of your petition.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newPetitionTitle}
                        onChange={handleNewPetitionTitleChange}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newPetitionDescription}
                        onChange={handleNewPetitionDescriptionChange}
                    />
                    <FormControl fullWidth margin="dense" variant="standard">
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={newPetitionCategory}
                            onChange={handleNewPetitionCategoryChange}
                        >
                            {categoriesData.map((category) => (
                                <MenuItem key={category.categoryId} value={category.categoryId}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <div>
                        {newPetitionSupportTiers.map((tier, index) => (
                            <div key={index}>
                                <TextField
                                    margin="dense"
                                    label={`Tier ${index + 1} Title`}
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    value={tier.title}
                                    onChange={(event) => handleNewPetitionSupportTierChange(index, 'title', event.target.value)}
                                />
                                <TextField
                                    margin="dense"
                                    label={`Tier ${index + 1} Description`}
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    value={tier.description}
                                    onChange={(event) => handleNewPetitionSupportTierChange(index, 'description', event.target.value)}
                                />
                                <TextField
                                    margin="dense"
                                    label={`Tier ${index + 1} Cost`}
                                    type="number"
                                    fullWidth
                                    variant="standard"
                                    value={tier.cost}
                                    onChange={(event) => handleNewPetitionSupportTierChange(index, 'cost', event.target.value)}
                                />
                                {newPetitionSupportTiers.length > 1 && (
                                    <IconButton onClick={() => handleRemoveSupportTier(index)}>
                                        <DeleteIcon/>
                                    </IconButton>
                                )}
                            </div>
                        ))}
                        {newPetitionSupportTiers.length < 3 && (
                            <Button onClick={handleAddSupportTier}>Add Support Tier</Button>
                        )}
                    </div>

                    <input
                        accept="image/*"
                        style={{display: 'none'}}
                        id="raised-button-file"
                        type="file"
                        onChange={handleNewPetitionImageChange}
                    />
                    <label htmlFor="raised-button-file">
                        <Button variant="contained" component="span">
                            Upload Image
                        </Button>
                    </label>
                    {newPetitionImageUrl && (
                        <div>
                            <img src={newPetitionImageUrl} alt="Selected Image"
                                 style={{maxWidth: '100%', maxHeight: '300px'}}/>
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateDialogClose}>Cancel</Button>
                    <Button onClick={handleCreatePetition}>Create</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openUploadImageDialog} onClose={handleUploadImageDialogClose}>
                <DialogTitle>Set Profile Picture(Optional)</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please select an image to be your profile picture. This step is optional
                        and you can choose to remove this image or set a different image later in account settings.
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

        </>
    );
};

export default PetitionList;

