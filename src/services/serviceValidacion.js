import axios from "axios";
import baseUrl from "../api/baseUrl";
const baseUri = `${baseUrl}/verificar_tramite`

const create = async (data) => {
    try {
        console.log("Sevece validacion:",data);
        const response = await axios.post(baseUri, data)
        
        return response.data
    } catch (error) {

        throw error
    }
}

export default {
    create:create
}