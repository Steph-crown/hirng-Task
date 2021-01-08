const express = require('express');
const bodyParser = require('body-parser');
const csval = require('csval');
const unirest = require('unirest');
const fs = require('fs')

const app = express();

// MIDDLEWARES
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

const PORT = '3000';
app.post('/parse', (req, res) => {

    // Gets request's body
    const {url, select_fields} = req.body.csv;

    const filterObject = (obj, select_fields) => {
        // A function that removes all keys in an object (1st arg) that is not present in the array (2nd arg)
        let newObj = {};
        Object.entries(obj)
            .forEach(([key, value]) => {
                if (select_fields.includes(key)) {
                    newObj[key] = value;
                }
            })
        return newObj;
    }

    // A function that generates a random key
    const getRandomKey = () =>  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);




    // Fetches the url content
    unirest.get(url)
        .then(response => {  
            return response.body
        })
        .then(async (csv) => {

            // Parses the CSV file
            let parsedCsv = await csval.parseCsv(csv);
            try {

                // Validates the CSV file
                const valid = await csval.validate(parsedCsv);
                if (valid) {
                    const conversion_key = getRandomKey();
                    // If select_fields is not passed
                    if (!select_fields) {
                        res.status(200).send({
                            conversion_key,
                            json: parsedCsv.data
                        })
                    }else {

                        // Filter the fields of objects in the parsedCsv array
                        let json = parsedCsv.data.map(obj => {
                            let newObj = filterObject(obj, select_fields);
                            return newObj;
                        })

                        res.status(200).json({
                            conversion_key,
                            json
                        });
                    }
                }
 


            }catch(err) {
                res.status(400).send(`Error ${err}`)
            }
        })
        .catch(err => res.status(400).send(`${err + " " + url} does not contain a valid CSV`))
});


app.listen(PORT, () => console.log(`Server is listening at port ${PORT}`))