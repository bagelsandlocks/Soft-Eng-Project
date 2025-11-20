import axios from "axios"

// npm add axios

// all WEB traffic using this API instance
// Make sure that you update the URL below to match the Cloud Formation Stack API endpoint.
// and add the suffix "/hangman" at the end
export const instance = axios.create({
    baseURL: 'https://XXXXXXXXXXX.amazonaws.com'
});

