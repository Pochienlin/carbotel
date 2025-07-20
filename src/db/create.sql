CREATE TABLE tdp (
    model TEXT UNIQUE,
    tdp NUMBER,
    normalized_model TEXT
    PRIMARY KEY (model)
);

CREATE TABLE gridCI (
    country TEXT,
    gridCI NUMBER,
    update_year INTEGER,
    PRIMARY KEY (country, update_year)
);