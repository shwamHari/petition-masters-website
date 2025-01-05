import axios from 'axios';
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    Paper,
    Container,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    DialogContentText, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import { useUserStore } from "../store";
import PetitionListObject from "./PetitionListObject";

interface EditSupportTier {
    title: string;
    description: string;
    cost: number;
}

interface Supporter {
    supportId: number;
    supportTierId: number;
    message: string | null;
    supporterId: number;
    supporterFirstName: string;
    supporterLastName: string;
    timestamp: string;
}

interface Petition {
    petitionId: number;
    title: string;
    description: string;
    creationDate: string;
    categoryId: number;
    numberOfSupporters: number;
    supportingCost: number;
    ownerId: number;
    ownerFirstName: string;
    ownerLastName: string;
    supportTiers: SupportTier[];
    moneyRaised: number;
    image_filename: string;
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




const Petition = () => {
    const { id } = useParams();
    const [petition, setPetition] = useState<Petition>({
        petitionId: 0,
        title: "",
        description: "",
        creationDate: "",
        categoryId: 0,
        numberOfSupporters: 0,
        supportingCost: 0,
        ownerId: 0,
        ownerFirstName: "",
        ownerLastName: "",
        supportTiers: [],
        moneyRaised: 0,
        image_filename: ""
    });

    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTier, setSelectedTier] = useState<SupportTier | null>(null);
    const [supportMessage, setSupportMessage] = useState("");

    const navigate = useNavigate();
    const [errorFlag, setErrorFlag] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const user = useUserStore(state => state.user);

    const [petitions, setPetitions] = useState<Petition[]>([]);
    const [ownerPetitions, setOwnerPetitions] = useState<Petition[]>([]);
    const [categoryPetitions, setCategoryPetitions] = useState<Petition[]>([]);

    const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
    const [unauthorizedDeletePopupOpen, setUnauthorizedDeletePopupOpen] = useState(false);
    const [unauthorizedSupportPopupOpen, setUnauthorizedSupportPopupOpen] = useState(false);

    const [editTitleDialog, setEditTitleDialog] = React.useState(false);
    const [newPetitionTitle, setNewPetitionTitle] = React.useState("");

    const [editDescriptionDialog, setEditDescriptionDialog] = React.useState(false);
    const [newPetitionDescription, setNewPetitionDescription] = React.useState("");

    const [editCategoryDialog, setEditCategoryDialog] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState<number | "">(petition.categoryId);

    const [editSupportTierDialog, setEditSupportTierDialog] = useState(false);
    const [editSupportTier, setEditSupportTier] = useState<EditSupportTier>({ title: "", description: "", cost: 0 });

    const [addSupportTierDialog, setAddSupportTierDialog] = useState(false);

    const [deleteSupportTierDialog, setDeleteSupportTierDialog] = useState(false);


    const [newPetitionCategory, setNewPetitionCategory] = React.useState<number | "">("");
    const [newPetitionSupportTier, setNewPetitionSupportTier] = React.useState<EditSupportTier>({ title: "", description: "", cost: 0 });

    const [editMode, setEditMode] = React.useState(false);



    useEffect(() => {
        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth" // Optional: adds smooth scrolling behavior
            });
        };

        scrollToTop();
    }, [id]);




    const getPetition = useCallback(() => {
        axios.get(`http://localhost:4941/api/v1/petitions/${id}`)
            .then((response) => {
                setErrorFlag(false);
                setErrorMessage("");
                setPetition(response.data);
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    }, [id]);

    const getOwnerPetitions = useCallback(() => {
        axios.get(`http://localhost:4941/api/v1/petitions?ownerId=${petition.ownerId}`)
            .then((response) => {
                setErrorFlag(false);
                setErrorMessage("");
                setOwnerPetitions(response.data.petitions);
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString() + " defaulting to old petitions changes app may not work as expected");
            });
    }, [petition.ownerId]);

    const getCategoryPetitions = useCallback(() => {
        axios.get(`http://localhost:4941/api/v1/petitions?categoryIds=${petition.categoryId}`)
            .then((response) => {
                setErrorFlag(false);
                setErrorMessage("");
                setCategoryPetitions(response.data.petitions);
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString() + " defaulting to old petitions changes app may not work as expected");
            });
    }, [petition.categoryId]);

    const mergeAndFilterPetitions = useCallback(() => {
        const mergedPetitions = [...ownerPetitions, ...categoryPetitions];
        const seenPetitionIds = new Set<number>();
        const filteredPetitions = mergedPetitions.filter((p) => {
            if (p.petitionId === petition.petitionId) {
                return false;
            }
            if (seenPetitionIds.has(p.petitionId)) {
                return false;
            } else {
                seenPetitionIds.add(p.petitionId);
                return true;
            }
        });
        setPetitions(filteredPetitions);
    }, [ownerPetitions, categoryPetitions, petition.petitionId]);

    useEffect(() => {
        getPetition();
    }, [getPetition, newPetitionTitle, newPetitionDescription, selectedCategory, supporters]);

    useEffect(() => {
        if (petition.ownerId) {
            getOwnerPetitions();
        }
    }, [petition.ownerId, getOwnerPetitions]);

    useEffect(() => {
        if (petition.categoryId) {
            getCategoryPetitions();
        }
    }, [petition.categoryId, getCategoryPetitions]);

    useEffect(() => {
        if (ownerPetitions.length > 0 || categoryPetitions.length > 0) {
            mergeAndFilterPetitions();
        }
    }, [ownerPetitions, categoryPetitions, mergeAndFilterPetitions]);

    useEffect(() => {
        axios.get(`http://localhost:4941/api/v1/petitions/${id}/supporters`)
            .then((response) => {
                setErrorFlag(false);
                setErrorMessage("");
                setSupporters(response.data);
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    }, [id]);

    const card = {
        padding: "10px",
        margin: "30px",
        display: "block",
        background: "aliceblue",
        fontFamily: "Roboto Slab"
    };

    const handleSupport = (tier: SupportTier) => {
        if (user.token === "") {
            setUnauthorizedSupportPopupOpen(true);
        } else{
            setSelectedTier(tier);
            setDialogOpen(true);
        }
    };

    const handleCloseDialog = () => {
        setSelectedTier(null);
        setSupportMessage("");
        setDialogOpen(false);
    };

    const handleSupportConfirmation = () => {
        if (!selectedTier) return;

        const requestData = supportMessage === ""
            ? { supportTierId: selectedTier.supportTierId }
            : { supportTierId: selectedTier.supportTierId, message: supportMessage };

        axios.post(`http://localhost:4941/api/v1/petitions/${id}/supporters`, requestData, {
            headers: { "X-Authorization": user.token }
        })
            .then(() => {
                axios.get(`http://localhost:4941/api/v1/petitions/${id}/supporters`)
                    .then((response) => {
                        setSupporters(response.data);
                    })
                    .catch((error) => {
                        setErrorFlag(true);
                        setErrorMessage(error.toString());
                    });
                handleCloseDialog();
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
                handleCloseDialog();
            });
    };

    const handleConfirmationDialogOpen = () => {
        setConfirmationDialogOpen(true);
    };

    const handleConfirmationDialogClose = () => {
        setConfirmationDialogOpen(false);
    };

    const handleUnauthorizedDeletePopupOpen = () => {
        setUnauthorizedDeletePopupOpen(true);
    };

    const handleUnauthorizedDeletePopupClose = () => {
        setUnauthorizedDeletePopupOpen(false);
    };

    const handleUnauthorizedSupportPopupOpen = () => {
        setUnauthorizedSupportPopupOpen(true);
    };

    const handleUnauthorizedSupportPopupClose = () => {
        setUnauthorizedSupportPopupOpen(false);
    };


    const handleDeleteButtonClick = () => {
        if (user.token && user.userId === petition.ownerId) {
            handleConfirmationDialogOpen();
        } else {
            handleUnauthorizedDeletePopupOpen();
        }
    };

    const handleDeleteConfirmation = () => {
        axios.delete(`http://localhost:4941/api/v1/petitions/${petition.petitionId}`, {
            headers: { "X-Authorization": user.token }
        })
            .then(response => {
                setErrorFlag(false);
                setErrorMessage("");
                setConfirmationDialogOpen(false);
                navigate('/petitions');
            })
            .catch(error => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
        setConfirmationDialogOpen(false);
    };


    const handleNewPetitionTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPetitionTitle(event.target.value);
    };

    const handleNewPetitionDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPetitionDescription(event.target.value);
    };

    const handleCategoryChange = (event: SelectChangeEvent<number>) => {
        setSelectedCategory(event.target.value as number);
    };

    const handleNewPetitionCategoryChange = (event: SelectChangeEvent<number>) => {
        setNewPetitionCategory(event.target.value as number);
    };

    const handleAddSupportTier = () => {
        setEditSupportTier({ title: "", description: "", cost: 0 })
        setAddSupportTierDialog(true)
    };

    const handleEditPetitionTitle = () => {

        axios.patch(`http://localhost:4941/api/v1/petitions/${petition.petitionId}`, {title: newPetitionTitle}, {

            headers: {
                'X-Authorization': user.token,
            },
        })
            .then((response) => {

                setErrorFlag(false);
                setErrorMessage("");
                setNewPetitionTitle("")
                setEditTitleDialog(false)
            })
            .catch((error) => {

                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };

    const handleEditPetitionDescription = () => {

        axios.patch(`http://localhost:4941/api/v1/petitions/${petition.petitionId}`, {description: newPetitionDescription}, {

            headers: {
                'X-Authorization': user.token,
            },
        })
            .then((response) => {

                setErrorFlag(false);
                setErrorMessage("");
                setNewPetitionDescription("")
                setEditDescriptionDialog(false)
            })
            .catch((error) => {

                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };

    const handleEditCategory = () => {
        axios.patch(`http://localhost:4941/api/v1/petitions/${petition.petitionId}`, { categoryId: selectedCategory }, {
            headers: {
                'X-Authorization': user.token,
            },
        })
            .then((response) => {
                setErrorFlag(false);
                setErrorMessage("");
                setEditCategoryDialog(false);
                setSelectedCategory("")
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };

    const handleEditSupportTierButtonClick = (tier: SupportTier) => {
        setSelectedTier(tier);
        setEditSupportTier({ title: tier.title, description: tier.description, cost: parseInt(String(tier.cost), 10) });
        setEditSupportTierDialog(true);
    };

    const handleDeleteSupportTierButtonClick = (tier: SupportTier) => {
        setSelectedTier(tier);
        setDeleteSupportTierDialog(true)


    };

    const handleDeleteSupportTierSubmit = () => {
        if (!selectedTier) return;

        axios.delete(`http://localhost:4941/api/v1/petitions/${petition.petitionId}/supportTiers/${selectedTier.supportTierId}`, {
            headers: { "X-Authorization": user.token }
        })
            .then(() => {
                getPetition()
                setDeleteSupportTierDialog(false)
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };


    const handleEditSupportTierChange = (field: keyof EditSupportTier, value: any) => {
        setEditSupportTier((prev) => ({ ...prev, [field]: value }));
    };

    const handleEditSupportTierSubmit = () => {
        if (!selectedTier) return;

        const requestData = {
            title: editSupportTier.title,
            description: editSupportTier.description,
            cost: parseInt(String(editSupportTier.cost), 10)
        }

        console.log(requestData)


        axios.patch(`http://localhost:4941/api/v1/petitions/${petition.petitionId}/supportTiers/${selectedTier.supportTierId}`, requestData, {
            headers: { "X-Authorization": user.token }
        })
            .then(() => {
                getPetition(); // refresh petition data to reflect the changes
                setEditSupportTierDialog(false);
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };


    const handleAddSupportTierSubmit = () => {

        const requestData = {
            title: editSupportTier.title,
            description: editSupportTier.description,
            cost: parseInt(String(editSupportTier.cost), 10)
        }

        axios.put(`http://localhost:4941/api/v1/petitions/${petition.petitionId}/supportTiers`, requestData, {
            headers: { "X-Authorization": user.token }
        })
            .then(() => {
                getPetition(); // refresh petition data to reflect the changes
                setAddSupportTierDialog(false);
            })
            .catch((error) => {
                setErrorFlag(true);
                setErrorMessage(error.toString());
            });
    };


    const category = categoriesData.find(cat => cat.categoryId === petition.categoryId);

    const defaultOwnerImage = "https://png.pngitem.com/pimgs/s/150-1503945_transparent-user-png-default-user-image-png-png.png"

    const petitions_rows = () => petitions.map((petition: Petition) => <PetitionListObject key={petition.petitionId + petition.title} petition={petition} />);

    const handleEditModeToggle = () => {
        setEditMode(prevEditMode => !prevEditMode);
    };



    return (
        <Paper elevation={10} style={card}>
            <IconButton aria-label="home" style={{color: "black", position: "absolute", top: 40, left: 40}}>
                <Link to={"/petitions"}><ArrowBackIcon fontSize={"large"}/>Back</Link>
            </IconButton>
            {user.token && user.userId === petition.ownerId &&
                <div style={{position: "absolute", top: 60, right: 50}}>
                    <div style={{marginBottom: 10}}>
                        <IconButton aria-label="edit" onClick={handleEditModeToggle} style={{color: "black"}}>
                            {editMode ? "Exit Edit Mode" : "Enter Edit Mode"} <EditIcon/>
                        </IconButton>
                    </div>
                    <div>
                        <IconButton aria-label="delete" style={{color: "black"}} onClick={handleDeleteButtonClick}>
                            Delete Petition<DeleteIcon/>
                        </IconButton>
                    </div>
                </div>
            }

            <h1 style={{
                marginTop: 60,
                fontWeight: 400,
                fontSize: "4rem",
                maxWidth: 800,
                textAlign: "center",
                margin: "0 auto"
            }}>
                {petition.title} {editMode &&
                <IconButton aria-label="edit" onClick={() => {
                    setEditTitleDialog(true)
                }} style={{color: "black", marginRight: 10}}>
                    Edit Title<EditIcon/>
                </IconButton>}
            </h1>
            <p>Created on: {new Date(petition.creationDate).toLocaleDateString()}
            </p>
            <img src={`http://localhost:4941/api/v1/petitions/${petition.petitionId}/image`} alt="Hero Image"
                 style={{height: 400, maxWidth: 810, marginTop: 10}}/>

            <p style={{
                marginTop: 40,
                fontWeight: 300,
                fontSize: "2.5rem",
                maxWidth: 600,
                textAlign: "center",
                margin: "0 auto"
            }}>
                Description:{editMode &&
                <IconButton aria-label="edit" onClick={() => {
                    setEditDescriptionDialog(true)
                }} style={{color: "black", marginRight: 10}}>
                    Edit Description<EditIcon/>
                </IconButton>}
            </p>

            <p style={{
                marginTop: 40,
                fontWeight: 300,
                fontSize: "1.5rem",
                maxWidth: 700,
                textAlign: "center",
                margin: "0 auto"
            }}>
                {petition.description}
            </p>

            <Typography variant="h5" fontFamily="Roboto Slab"  marginTop="40px" fontWeight="300px">
                <img
                    src={`http://localhost:4941/api/v1/users/${petition.ownerId}/image` || defaultOwnerImage}
                    onError={(e) => {
                        e.currentTarget.src = defaultOwnerImage;
                    }}
                    alt="Owner"
                    style={{height: 150, maxWidth: 250, borderRadius: "50%", marginRight: 10}}
                />
                Owner: {petition.ownerFirstName} {petition.ownerLastName}
            </Typography>


            <Typography variant="h4" style={{marginTop: 40}} fontFamily="Roboto Slab">
                <p style={{fontWeight: 300}}>Category: {category ? category.name : "Unknown"}</p>
                    {editMode &&
                <IconButton aria-label="edit" onClick={() => setEditCategoryDialog(true)}
                            style={{color: "black"}}>
                    Edit Category<EditIcon/>
                </IconButton>}
            </Typography>

            <Typography variant="h4" style={{marginTop: 40}} fontFamily="Roboto Slab">
                <p style={{fontWeight: 300}}>{petition.numberOfSupporters} supporters</p>
            </Typography>
            <Typography variant="h4" style={{maxWidth: 400, textAlign: "center", margin: "0 auto"
            }} fontFamily="Roboto Slab">
                <p style={{marginTop: 40, fontWeight: 300}}>${petition.moneyRaised} raised so far.</p>
                <p style={{fontWeight: 300}}>Contribute to the cause by supporting one of the tiers below.</p>
            </Typography>


            <h2 style={{fontSize: "4rem", marginTop: 60, fontWeight: 300}}>Support Tiers:</h2>
            {petition.supportTiers ? (
                petition.supportTiers.map((tier: SupportTier) => (
                    <SupportTierDetails key={tier.supportTierId} tier={tier}
                                        supporters={supporters.filter(supporter => supporter.supportTierId === tier.supportTierId)}
                                        onSupport={() => handleSupport(tier)}
                                        onEdit={() => handleEditSupportTierButtonClick(tier)}
                                        onDelete={() => handleDeleteSupportTierButtonClick(tier)}
                                        editMode={editMode}
                                        numberOfTiers={petition.supportTiers.length}
                    />
                ))
            ) : (
                <div>No support tiers available</div>
            )}
            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>{selectedTier?.title}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="message"
                        label="Message (Optional)"
                        type="text"
                        fullWidth
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSupportConfirmation} color="primary">Support</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editSupportTierDialog} onClose={() => setEditSupportTierDialog(false)}>
                <DialogTitle>Edit Support Tier</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Edit the details of the support tier.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        type="text"
                        fullWidth
                        value={editSupportTier.title}
                        onChange={(e) => handleEditSupportTierChange('title', e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        type="text"
                        fullWidth
                        value={editSupportTier.description}
                        onChange={(e) => handleEditSupportTierChange('description', e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Cost"
                        type="number"
                        fullWidth
                        value={editSupportTier.cost}
                        onChange={(e) => handleEditSupportTierChange('cost', e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditSupportTierDialog(false)}>Cancel</Button>
                    <Button onClick={handleEditSupportTierSubmit}>Save</Button>
                </DialogActions>
            </Dialog>


            <Dialog open={addSupportTierDialog} onClose={() => setAddSupportTierDialog(false)}>
                <DialogTitle>Add Support Tier</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Enter the details of the new support tier.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        type="text"
                        fullWidth
                        value={editSupportTier.title}
                        onChange={(e) => handleEditSupportTierChange('title', e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        type="text"
                        fullWidth
                        value={editSupportTier.description}
                        onChange={(e) => handleEditSupportTierChange('description', e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Cost"
                        type="number"
                        fullWidth
                        value={editSupportTier.cost}
                        onChange={(e) => handleEditSupportTierChange('cost', e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddSupportTierDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddSupportTierSubmit}>Save</Button>
                </DialogActions>
            </Dialog>


            <Dialog open={confirmationDialogOpen} onClose={handleConfirmationDialogClose}>
                <DialogTitle>Delete Petition</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this petition?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmationDialogClose}>Cancel</Button>
                    <Button onClick={handleDeleteConfirmation} color="primary">Delete</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteSupportTierDialog} onClose={() => setDeleteSupportTierDialog(false)}>
                <DialogTitle>Delete Tier</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this tier?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmationDialogClose}>Cancel</Button>
                    <Button onClick={handleDeleteSupportTierSubmit} color="primary">Delete</Button>
                </DialogActions>
            </Dialog>


            <Dialog open={unauthorizedDeletePopupOpen} onClose={handleUnauthorizedDeletePopupClose}>
                <DialogTitle>Unauthorized Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You are not authorized to delete this petition. Only the owner can delete the petition
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUnauthorizedDeletePopupClose} color="primary">OK</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={unauthorizedSupportPopupOpen} onClose={handleUnauthorizedSupportPopupClose}>
                <DialogTitle>Unauthorised Support</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please Sign in to support petitions.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUnauthorizedSupportPopupClose} color="primary">OK</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editTitleDialog} onClose={() => {
                setEditTitleDialog(false)
                setNewPetitionTitle("")

            }}>
                <DialogTitle>Edit Title</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        What would you like to change the title to?
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

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setEditTitleDialog(false)
                        setNewPetitionTitle("")
                    }}>Cancel</Button>
                    <Button onClick={handleEditPetitionTitle}>Submit</Button>
                </DialogActions>
            </Dialog>


            <Dialog open={editDescriptionDialog} onClose={() => {
                setEditDescriptionDialog(false)
                setNewPetitionDescription("")

            }}>
                <DialogTitle>Edit Description</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        What would you like to change the description to?
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newPetitionDescription}
                        onChange={handleNewPetitionDescriptionChange}
                    />

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setEditDescriptionDialog(false)
                        setNewPetitionDescription("")
                    }}>Cancel</Button>
                    <Button onClick={handleEditPetitionDescription}>Submit</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editCategoryDialog} onClose={() => {
                setEditCategoryDialog(false)
                setSelectedCategory("")
            }}>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Select a new category for the petition:
                    </DialogContentText>
                    <FormControl fullWidth>
                        <InputLabel id="category-select-label">Category</InputLabel>
                        <Select
                            labelId="category-select-label"
                            id="category-select"
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            label="Category"
                        >
                            {categoriesData.filter(cat => cat.categoryId !== petition.categoryId).map(category => (
                                <MenuItem key={category.categoryId} value={category.categoryId}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setEditCategoryDialog(false)
                        setSelectedCategory("")
                    }}>Cancel</Button>
                    <Button onClick={handleEditCategory}>Submit</Button>
                </DialogActions>
            </Dialog>

            {editMode && petition.supportTiers.length < 3 && (
                <div style={{textAlign: "center", marginTop: "20px"}}>
                    <Button variant="outlined" onClick={handleAddSupportTier}>Add Tier</Button>
                </div>
            )}


            <div>
                <h2 style={{fontSize: "4rem", marginTop: 80, marginBottom: 20, fontWeight: 300}}>Similar Petitions:</h2>
                {petitions_rows()}
            </div>

        </Paper>
    );
};

const SupportTierDetails = ({tier, supporters, onSupport, onEdit, onDelete, editMode, numberOfTiers}: {
    tier: SupportTier,
    supporters: Supporter[],
    onSupport: () => void,
    onEdit: () => void,
    onDelete: () => void,
    editMode: boolean,
    numberOfTiers: number
}) => {
    return (
        <div style={{
            margin: "auto",
            width: "50%",
            position: "relative"
        }}>
            <div style={{textAlign: "center", marginBottom: "10px", marginTop: 50}}>
                <h4 style={{fontSize: "2rem", fontWeight: 400}}>{tier.title}</h4>

                {editMode ? (
                    <>
                        <IconButton aria-label="edit" onClick={onEdit}>
                            Edit Tier<EditIcon/>
                        </IconButton>
                        {numberOfTiers > 1 && (
                            <IconButton aria-label="delete" onClick={onDelete}>
                                Delete Tier<DeleteIcon/>
                            </IconButton>
                        )}
                    </>
                ) : (
                    <IconButton style={{color: "blue"}} aria-label="support" onClick={onSupport}>
                        <LoyaltyIcon/>Support
                    </IconButton>
                )}

                <p style={{fontSize: "1.4rem", fontWeight: 300}}>{tier.description}</p>
                <p style={{fontSize: "1.4rem", fontWeight: 300}}>Cost: {tier.cost}</p>

            </div>
            <div>
                <h5 style={{fontWeight: 400, fontSize: "1.5rem", marginBottom: 20}}>People who support at this level:</h5>
                {supporters.map(supporter => (
                    <li key={supporter.supportId} style={{listStyleType: "none", textAlign: "center"}}>
                        <div>
                            <p style={{fontWeight: 300, fontSize: "1.2rem", marginBottom: 0, marginTop: 25}}>{supporter.supporterFirstName} {supporter.supporterLastName}</p>
                            {supporter.message && <p style={{fontWeight: 300, fontSize: "1.2rem", marginBottom: 0}}>"{supporter.message}"</p>}
                        </div>
                    </li>
                ))}
            </div>
        </div>
    );
};



export default Petition;
