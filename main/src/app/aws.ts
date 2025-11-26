import axios from "axios"

// npm add axios

// all WEB traffic using this API instance
// Make sure that you update the URL below to match the Cloud Formation Stack API endpoint.
// and add the suffix "/shopcomp" at the end
export const instance = axios.create({
    baseURL: 'https://qeyuwyqv30.execute-api.us-east-2.amazonaws.com/prod/shopcomp'
});

