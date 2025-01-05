import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { Delete, Edit } from "@mui/icons-material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    TextField,
    Typography
} from "@mui/material";
import CSS from 'csstype';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface IPetitionProps {
    petition: Petition;
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

const PetitionListObject = (props: IPetitionProps) => {
    const [petition] = useState<Petition>(props.petition);
    const [image, setImage] = useState("");
    const [title, setTitle] = useState("");
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const userCardStyles: CSS.Properties = {
        display: "inline-block",
        height: "fit-content",
        width: "650px",
        margin: "10px",
        padding: "0px",
        fontFamily: "Roboto Slab"
    };

    const category = categoriesData.find(cat => cat.categoryId === petition.categoryId);
    const defaultOwnerImage = "https://png.pngitem.com/pimgs/s/150-1503945_transparent-user-png-default-user-image-png-png.png"

    return (
        <Card sx={userCardStyles}>
            <CardMedia
                component="img"
                height="400"
                sx={{ objectFit: "contain", width: "100%" }}
                image={`http://localhost:4941/api/v1/petitions/${petition.petitionId}/image`}
                alt={petition.title + " image"}
            />
            <CardContent>
                <Typography variant="h4" fontFamily="Roboto Slab" fontSize= "3rem" fontWeight="300" marginBottom="10px" height="100px">
                    Title: {petition.title}
                </Typography>

                <Typography variant="h6" fontWeight="400" fontFamily="Roboto Slab" marginBottom="10px" marginTop="30px">
                    Created on: {new Date(petition.creationDate).toLocaleDateString()}
                </Typography>
                <Typography variant="h6" fontWeight="400" fontFamily="Roboto Slab">
                    <img
                        src={`http://localhost:4941/api/v1/users/${petition.ownerId}/image` || defaultOwnerImage}
                        onError={(e) => { e.currentTarget.src = defaultOwnerImage; }}
                        alt="Owner"
                        style={{ height: 120, maxWidth: 250, borderRadius: "50%", marginRight: 10 }}
                    />
                    Owner: {petition.ownerFirstName} {petition.ownerLastName}
                </Typography>

                <Typography variant="h6" fontWeight="400" fontFamily="Roboto Slab" marginTop="10px" marginBottom="20px">
                    Category: {category ? category.name : "Unknown"}
                </Typography>

                <Typography variant="h6" fontWeight="400" fontFamily="Roboto Slab" marginTop="10px">
                    Supporting Cost: {petition.supportingCost}
                </Typography>
            </CardContent>
            <CardActions>
                <IconButton aria-label="home" style={{ marginRight: 0, textAlign: "right" }}>
                    <Link to={`/petitions/${petition.petitionId}`}>View Full Petition<ArrowForwardIcon fontSize={"large"} /></Link>
                </IconButton>
            </CardActions>
        </Card>
    );
};

export default PetitionListObject;
