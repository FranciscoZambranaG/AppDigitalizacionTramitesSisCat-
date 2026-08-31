// services/tramiteService.js
import axios from 'axios';
import baseUrl from '../api/baseUrl';

const validarTramite = async ({ id_funcionario, id_unidad, nro_tramite }) => {
  try {
    const response = await axios.post(`${baseUrl}/verificar_tramite`, {
      id_funcionario,
      id_unidad,
      nro_tramite
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return response.data;

  } catch (error) {

    throw error;
  }
};

export default { validarTramite };
