// config.ts
import * as dotenv from 'dotenv';
import path from 'path';

// Carga las variables de entorno desde el archivo .env correspondiente al entorno actual
const environment = process.env.NODE_ENV || 'dev';
dotenv.config({ path: path.resolve(__dirname, `${environment}.env`) })

export default {
  url: process.env.URL!,
  user: process.env.USERLOGIN!,
  pass: process.env.PASS!,
  id_document: process.env.ID_DOCUMENT!,
  data_document: process.env.DATA_DOCUMENT!,
  money_request: process.env.MONEY_REQUEST!,
  dues_request: process.env.DUES_REQUEST!,
  email: process.env.EMAIL!,
  cell: process.env.CELL!,
  lastname1: process.env.LASTNAME1!,
  lastname2: process.env.LASTNAME2!,
  name: process.env.NAME!,
  birth: process.env.BIRTH!,
  actividadlaboral1: process.env.ACTIVIDADLABORAL1!,
  prestacion_service: process.env.PRESTACION_SERVICE!,
  cotiza: process.env.COTIZA!,
  vendedor: process.env.VENDEDOR!,
  income: process.env.INCOME!,
  seguro: process.env.SEGURO!,
  
  fullscreen: null,
};
