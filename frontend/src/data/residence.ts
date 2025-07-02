import { AddressSchemaType } from "@/schema/delivery-form";

export const dormList = ["chestnut", "campusOne", "parkside"] as const;
export type dorm = (typeof dormList)[number];

export const schoolList = ["uoft", "tmu", "york"] as const;
export type school = (typeof schoolList)[number];

export const dormSelectList: { key: string; label: string; school?: string }[] =
    [
        {
            key: "Align (Winnipeg)",
            label: "Align (Winnipeg)",
            school: "University of Manitoba",
        },
        {
            key: "Alma Sandy Hill",
            label: "Alma Sandy Hill",
            school: "University of Ottawa",
        },
        {
            key: "Alma at Byward Market",
            label: "Alma at Byward Market",
            school: "University of Ottawa",
        },
        {
            key: "308 King",
            label: "308 King",
            school: "University of Waterloo",
        },
        {
            key: "Fergus House",
            label: "Fergus House",
            school: "Wilfrid Laurier University",
        },
        {
            key: "Hespeler House",
            label: "Hespeler House",
            school: "Wilfrid Laurier University",
        },
        {
            key: "HOEM",
            label: "HOEM",
            school: "Toronto Metropolitan University",
        },
        {
            key: "Arc (Winnipeg)",
            label: "Arc (Winnipeg)",
            school: "University of Manitoba",
        },
        {
            key: "Campus1 MTL",
            label: "Campus1 MTL",
            school: "McGill or Concordia University",
        },
        {
            key: "Alma at Montreal",
            label: "Alma at Montreal",
            school: "McGill or Concordia University",
        },
        {
            key: "Alma at Guelph",
            label: "Alma at Guelph",
            school: "University of Guelph",
        },
        // Unknown affiliations left blank
        { key: "17Hundred", label: "17Hundred" },
        { key: "1Eleven", label: "1Eleven" },
        { key: "1Ten on Whyte", label: "1Ten on Whyte" },
        { key: "417 Nelson", label: "417 Nelson" },
        { key: "Avant", label: "Avant" },
        { key: "Boreal", label: "Boreal" },
        { key: "Bridgeport House", label: "Bridgeport House" },
        { key: "Cambrian", label: "Cambrian" },
        {
            key: "Campus One Toronto",
            label: "CampusOne Toronto",
            school: "University of Toronto",
        },
        { key: "Canadore", label: "Canadore" },
        { key: "Canvas Lofts", label: "Canvas Lofts" },
        {
            key: "Carleton University",
            label: "Carleton University",
            school: "Carleton University",
        },
        {
            key: "Centennial Place Residence",
            label: "Centennial Place Residence",
        },
        {
            key: "Chestnut Residence",
            label: "Chestnut Residence",
            school: "University of Toronto",
        },
        {
            key: "Conestoga (Kitchener)",
            label: "Conestoga (Kitchener)",
            school: "Conestoga College",
        },
        {
            key: "Conestoga (Waterloo)",
            label: "Conestoga (Waterloo)",
            school: "Conestoga College",
        },
        { key: "DCOT", label: "DCOT" },
        { key: "Ezra-Bricker Apartments", label: "Ezra-Bricker Apartments" },
        { key: "Fanshawe", label: "Fanshawe", school: "Fanshawe College" },
        {
            key: "George Brown",
            label: "George Brown",
            school: "George Brown College",
        },
        { key: "Graduate House", label: "Graduate House" },
        { key: "Harmony Commons", label: "Harmony Commons" },
        { key: "Hazelview", label: "Hazelview" },
        {
            key: "Innis College",
            label: "Innis College",
            school: "University of Toronto",
        },
        {
            key: "Joan Foley Hall Apartments",
            label: "Joan Foley Hall Apartments",
        },
        { key: "King Street Towers", label: "King Street Towers" },
        {
            key: "Knox College",
            label: "Knox College",
            school: "University of Toronto",
        },
        { key: "Lambton", label: "Lambton" },
        {
            key: "Loretto College",
            label: "Loretto College",
            school: "University of St. Michael's College / U of T",
        },
        { key: "Luxe London", label: "Luxe London" },
        { key: "Maisonville Yards", label: "Maisonville Yards" },
        { key: "Mohawk", label: "Mohawk", school: "Mohawk College" },
        {
            key: "MyRez on Lester (181 Lester)",
            label: "MyRez on Lester (181 Lester)",
        },
        { key: "Neill-Wycik", label: "Neill-Wycik" },
        {
            key: "New College",
            label: "New College",
            school: "University of Toronto",
        },
        {
            key: "Niagara (NOTL)",
            label: "Niagara (NOTL)",
            school: "Niagara College",
        },
        {
            key: "Niagara (Welland)",
            label: "Niagara (Welland)",
            school: "Niagara College",
        },
        { key: "Northern", label: "Northern" },
        { key: "Oak House", label: "Oak House" },
        {
            key: "Okanagan - Kelowna",
            label: "Okanagan - Kelowna",
            school: "UBC Okanagan",
        },
        {
            key: "Okanagan - Vernon",
            label: "Okanagan - Vernon",
            school: "UBC Okanagan",
        },
        {
            key: "Parkside Student Residence",
            label: "Parkside Student Residence",
        },
        { key: "Preston House", label: "Preston House" },
        { key: "Quad Phase 1 (Toronto)", label: "Quad Phase 1 (Toronto)" },
        { key: "Quad Phase 2 (Toronto)", label: "Quad Phase 2 (Toronto)" },
        { key: "Regent Student Living", label: "Regent Student Living" },
        { key: "See-More", label: "See-More" },
        {
            key: "Seneca (King)",
            label: "Seneca (King)",
            school: "Seneca College",
        },
        {
            key: "Seneca (Newham)",
            label: "Seneca (Newham)",
            school: "Seneca College",
        },
        { key: "Skirtch", label: "Skirtch" },
        {
            key: "Southern Alberta Institute of Technology (SAIT)",
            label: "Southern Alberta Institute of Technology (SAIT)",
            school: "SAIT",
        },
        {
            key: "St. Clair College (Chatham)",
            label: "St. Clair College (Chatham)",
            school: "St. Clair College",
        },
        {
            key: "St. Clair College (Windsor)",
            label: "St. Clair College (Windsor)",
            school: "St. Clair College",
        },
        {
            key: "St. Lawrence College",
            label: "St. Lawrence College",
            school: "St. Lawrence College",
        },
        {
            key: "St. Michaels College",
            label: "St. Michaels College",
            school: "University of St. Michael's College / U of T",
        },
        { key: "Student Family Housing", label: "Student Family Housing" },
        { key: "Suite Times", label: "Suite Times" },
        { key: "THEO", label: "THEO" },
        {
            key: "TMU Bookstore",
            label: "TMU Bookstore",
            school: "Toronto Metropolitan University",
        },
        {
            key: "TMU Residence",
            label: "TMU Residence",
            school: "Toronto Metropolitan University",
        },
        {
            key: "Thompson Rivers University (TRU)",
            label: "Thompson Rivers University (TRU)",
            school: "TRU",
        },
        { key: "Townhouses", label: "Townhouses" },
        {
            key: "Trinity College",
            label: "Trinity College",
            school: "University of Toronto",
        },
        {
            key: "UTM",
            label: "UTM",
            school: "University of Toronto Mississauga",
        },
        { key: "Unity Point & Place", label: "Unity Point & Place" },
        {
            key: "University College",
            label: "University College",
            school: "University of Toronto",
        },
        {
            key: "University of Alberta Bookstore",
            label: "University of Alberta Bookstore",
            school: "University of Alberta",
        },
        {
            key: "University of Sudbury",
            label: "University of Sudbury",
            school: "University of Sudbury",
        },
        {
            key: "Victoria College",
            label: "Victoria College",
            school: "University of Toronto",
        },
        { key: "West Village Suites", label: "West Village Suites" },
        {
            key: "Wilfrid Laurier University",
            label: "Wilfrid Laurier University",
            school: "Wilfrid Laurier University",
        },
        {
            key: "Wilfrid Laurier University HawkShop",
            label: "Wilfrid Laurier University HawkShop",
            school: "Wilfrid Laurier University",
        },
        { key: "Woodroffe Place", label: "Woodroffe Place" },
        {
            key: "Woodsworth College",
            label: "Woodsworth College",
            school: "University of Toronto",
        },
    ];

export const schoolSelectList: { key: string; label: string }[] = [
    { key: "University of Manitoba", label: "University of Manitoba" },
    { key: "University of Ottawa", label: "University of Ottawa" },
    { key: "University of Guelph", label: "University of Guelph" },
    {
        key: "McGill or Concordia University",
        label: "McGill or Concordia University",
    },
    { key: "Carleton University", label: "Carleton University" },
    { key: "Conestoga College", label: "Conestoga College" },
    { key: "Fanshawe College", label: "Fanshawe College" },
    { key: "Wilfrid Laurier University", label: "Wilfrid Laurier University" },
    { key: "George Brown College", label: "George Brown College" },
    {
        key: "Toronto Metropolitan University",
        label: "Toronto Metropolitan University",
    },
    { key: "University of Toronto", label: "University of Toronto" },
    {
        key: "University of St. Michael’s College / U of T",
        label: "University of St. Michael’s College / U of T",
    },
    { key: "Mohawk College", label: "Mohawk College" },
    { key: "Niagara College", label: "Niagara College" },
    { key: "UBC Okanagan", label: "UBC Okanagan" },
    { key: "Seneca College", label: "Seneca College" },
    {
        key: "Southern Alberta Institute of Technology (SAIT)",
        label: "Southern Alberta Institute of Technology (SAIT)",
    },
    { key: "St. Clair College", label: "St. Clair College" },
    { key: "St. Lawrence College", label: "St. Lawrence College" },
    { key: "Thompson Rivers University", label: "Thompson Rivers University" },
    {
        key: "University of Toronto Mississauga",
        label: "University of Toronto Mississauga",
    },
    { key: "University of Alberta", label: "University of Alberta" },
    { key: "University of Sudbury", label: "University of Sudbury" },
];

export const campusOneAddress: AddressSchemaType = {
    street: "253 College St",
    country: "CA",
    city: "Toronto",
    state: "ON",
    postalCode: "M5T 1R5",
};
