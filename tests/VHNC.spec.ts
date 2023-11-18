import { test, expect, chromium } from '@playwright/test';
import * as fs from 'fs';
import config from './config';
import { Page } from 'playwright';
const { exec } = require('child_process');
const login = async ({ page }) => {
  await page.goto(config.url);
  await page.getByPlaceholder('Usuario').fill(config.user); // se ingresa en username
  await page.getByPlaceholder('Contraseña').fill(config.pass); // se ingresa en password
  await page.getByRole('button', { name: 'ACEPTAR' }).click();
  await page.getByRole('combobox').first().selectOption('13: Object');
  await page.getByRole('combobox').nth(1).selectOption('7: 37');
  await page.getByPlaceholder('Tipo de identificación').click();
  await page.getByPlaceholder('Tipo de identificación').fill(config.id_document);// se ingresa el id
  await page.getByPlaceholder('Numero de identificación').click();
  await page.getByPlaceholder('Numero de identificación').fill(config.data_document);// se ingresa la data
  await page.getByRole('button', { name: 'ACEPTAR' }).click();
};



const captureGTMEvents = (message: any, stream: any) => {
  const text = message.text();
  if (text.includes('{buttonEventCategory:')) {
    // Reemplazar dos puntos por comillas dobles y asegurar que las cadenas estén entre comillas
    const correctedText = text.replace(/([a-zA-Z0-9]+)\s*:\s*("[^"]*"|[^,]*)(?=,|\s*})/g, '"$1": $2');
    // Asegurar que todos los valores de las propiedades estén entre comillas
    const finalText = correctedText.replace(/("[a-zA-Z0-9]+":)\s*([^"][^,}]*)/g, '$1 "$2"');
    // Corregir el formato de "event" y "eventvalue"
    const fixedEventValue = finalText.replace(/"eventvalue":\s*("[^"]*"|[^,]*)(?=,|\s*})/g, '"eventvalue": ""');
    const fixedEvent = fixedEventValue.replace(/"event":\s*("[^"]*"|[^,]*)(?=,|\s*})/g, '"event": "pageview"');

    try {
      const jsonData = JSON.parse(`${fixedEvent}`);
      const formattedText = JSON.stringify(jsonData, null, 2);
      stream.write(formattedText + '\n');
      stream.write('\n');

      // Hacer algo con formattedText, como escribirlo en un stream
      // stream.write(formattedText + '\n');
    } catch {
      console.error('Error al parsear el mensaje como JSON:')
      stream.write(text + '\n');
      stream.write('\n');
    }
  }
};


async function actividadLaboral(actividadlaboral1: string, prestacion_service: string, prestacion: string, actividadeconomica1: string, page1: Page) {
  if ("//p[normalize-space()='Empleado/a']" === actividadlaboral1) {
    await page1.waitForSelector(actividadlaboral1);
    await page1.click(actividadlaboral1);
    await page1.waitForSelector("//input[@id='empresa']");
    await page1.fill("//input[@id='empresa']", 'IBM');
    await page1.waitForSelector("//div[@id='tipoContrato']");
    await page1.click("//div[@id='tipoContrato']");

    if ("//p[normalize-space()='Prestación de servicios']" === prestacion_service ||
      "//p[normalize-space()='Término fijo']" === prestacion_service ||
      "//p[normalize-space()='Término indefinido']" === prestacion_service) {
      await page1.waitForSelector(prestacion);
      await page1.click(prestacion);
    }
  } else if ("//p[normalize-space()='Independiente']" === actividadlaboral1) {
    await page1.waitForSelector(actividadlaboral1);
    await page1.click(actividadlaboral1);

    await page1.waitForSelector(actividadeconomica1);
    await page1.fill(actividadeconomica1, "tec");

    await page1.waitForSelector(actividadeconomica1);
    await page1.click(actividadeconomica1);
  } else {
    await page1.waitForSelector(actividadlaboral1);
    await page1.click(actividadlaboral1);
  }
}

const getKubernetesLogs = () => {
  const SERVICE_NAME = 'creditovehiculonoclientes-wf-service'; // Reemplaza con el nombre real de tu servicio
const numberOfLines = 200; // Cantidad de líneas de logs a obtener

const command = `kubectl logs --tail=${numberOfLines} svc/${SERVICE_NAME}`;

let logs = ''; // Variable para almacenar los logs

const child = exec(command);

child.stdout.on('data', (data) => {
  logs += data; // Almacena los logs en la variable
});

child.stderr.on('data', (data) => {
  console.error(`Error en la salida estándar: ${data}`);
});

child.on('error', (error) => {
  console.error(`Error al ejecutar el comando: ${error.message}`);
});

child.on('exit', (code) => {
  const outputPath = 'LogsWF.txt'; // Nombre del archivo de salida

  // Separar las líneas del texto de logs
  const lineas = logs.split('\n');
  // Filtrar las líneas de step y payload
  const steps = lineas.filter(linea => linea.startsWith('        Step Response ->')).map(linea => linea.trim());
  const payloads = lineas.filter(linea => linea.startsWith('        payload ->')).map(linea => {
    // Intentar extraer el JSON de la línea, omitiendo "payload ->"
    const jsonPart = linea.substring(linea.indexOf('{'));
    return jsonPart.trim();
  });

  // Crear contenido a escribir en el archivo
  let fileContent = '';

  // Combinar los steps y payloads
  if (steps.length === payloads.length) {
    for (let i = 0; i < steps.length; i++) {
      fileContent += steps[i] + "\n";
      fileContent +=  "\n";
      try {
        fileContent += 'Payload -> ' + JSON.stringify(JSON.parse(payloads[i]), null, 2) + "\n";
        fileContent +=  "\n";
      } catch (error) {
        console.error('Error en el formato JSON:', error.message);
       
        fileContent += 'Payload: ' + payloads[i] + "\n";
      }
    }
  } else {
    fileContent += 'La cantidad de steps y payloads no coincide para la combinación.\n';
  }

  // Escribir el contenido en el archivo
  fs.writeFile(outputPath, fileContent, (err) => {
    if (err) {
      console.error('Error al escribir en el archivo:', err);
      return;
    }
  });
});
}



test('VHNC', async ({ page }) => {
  const actividadlaboral1 = config.actividadlaboral1
  const prestacion_service = config.prestacion_service;
  const prestacion = config.prestacion_service;
  const actividadeconomica1 = config.actividadlaboral1;
  const outputFile = 'GTM.txt';

  // Toma las medidas de la pantalla
  await page.setViewportSize({ width: 1792, height: 1043 });

  await login({ page });
  const page1Promise = page.waitForEvent('popup');
  const page1 = await page1Promise;
  await page.close();
  const stream = fs.createWriteStream(outputFile, { flags: 'w' });
  page1.on('console', (message) => captureGTMEvents(message, stream));


  await page1.waitForSelector("//img[@alt='listBenefits__imageBenefits']");
  await page1.screenshot({ path: 'Pantalla_Beneficio.png', fullPage: true });

  await page1.getByRole('button', { name: 'Continuar' }).click();
  await page1.getByPlaceholder('Ingrese número de documento').click();
  await page1.getByPlaceholder('Ingrese número de documento').fill(config.data_document);
  await page1.screenshot({ path: 'Pantalla_Informacion1.png', fullPage: true });

  await page1.getByRole('button', { name: 'Continuar' }).click();

  await page1.locator('label').filter({ hasText: 'Acepto' }).click();
  await page1.screenshot({ path: 'Pantalla_Informacion2.png', fullPage: true });
  await page1.getByRole('button', { name: 'Continuar' }).click();

  await page1.getByPlaceholder('$0,00').fill(config.money_request);
  await page1.getByPlaceholder('0', { exact: true }).fill(config.dues_request);
  await page1.screenshot({ path: 'Pantalla_Simulacion.png', fullPage: true });
  await page1.locator('body').click();
  await page1.getByRole('button', { name: 'Simular' }).click();


  await page1.getByRole('button', { name: 'Ver más flecha abajo' }).click();
  await page1.screenshot({ path: 'Pantalla_Resultado.png', fullPage: true });
  await page1.getByRole('button', { name: 'Hacer otra simulación' }).click();

  await page1.getByPlaceholder('$0,00').fill(config.money_request);
  await page1.getByPlaceholder('0', { exact: true }).fill(config.dues_request);
  await page1.locator('body').click();
  await page1.getByRole('button', { name: 'Simular' }).click();

  await page1.getByRole('button', { name: 'Solicitar Crédito' }).click();

  await page1.getByPlaceholder('Ingrese su correo electrónico').fill(config.email);
  await page1.getByPlaceholder('Ingrese su número de celular').fill(config.cell);
  await page1.screenshot({ path: 'Pantalla_otp.png', fullPage: true });
  await page1.getByRole('button', { name: 'Continuar' }).click();

  // Obtener el texto del elemento
  const otpElement = await page1.waitForSelector("//p[contains(text(),'otp')]");
  await page1.screenshot({ path: 'Pantalla_otp2.png', fullPage: true });
  const otp = await otpElement.innerHTML();

  // Extraer el número OTP
  const otpnumber = otp.slice(13, 21);
  // Ingresar el OTP en el campo de entrada
  const inputElement = await page1.waitForSelector("//input[@id='inputotp']");

  await page1.waitForTimeout(500)
  await inputElement.fill(otpnumber);
  await page1.waitForTimeout(500)
  await page1.getByRole('button', { name: 'Continuar' }).click();

  const primerApellido = await page1.waitForSelector("//input[@id='primerApellido']");
  const segundoApellido = await page1.waitForSelector("//input[@id='segundoApellido']");
  const date = await page1.waitForSelector("//input[@name='davDateTextField']");

  await primerApellido.fill(config.lastname1);// se ingresa el primer apellido
  await segundoApellido.fill(config.lastname2);// se ingresa el segundo apellido
  await page1.getByPlaceholder('Nombre').fill(config.name);

  await date.fill(config.birth);
  const actividad = await page1.waitForSelector("//p[normalize-space()='Actividad']")
  actividad.click();

  await actividadLaboral(actividadlaboral1, prestacion_service, prestacion, actividadeconomica1, page1);
  await page1.waitForTimeout(1000);

  await page1.getByPlaceholder('$0,00').fill(config.income);

  const regimen = await page1.waitForSelector("//div[@id='regimenSalud']");
  regimen.click();

  const cotiza = await page1.waitForSelector(config.cotiza);
  cotiza.click();

  const vendedor = await page1.waitForSelector("//div[@id='vendedor']");
  vendedor.click();

  const concesioanrio = await page1.waitForSelector(config.vendedor);
  concesioanrio.click();
  await page1.getByRole('button', { name: 'Continuar' }).click();

  const seguro = await page1.waitForSelector(config.seguro);
  seguro.click();

  const evaluacion = await page1.waitForSelector("//button[normalize-space()='Solicitar Crédito']");
  evaluacion.click();
  await getKubernetesLogs();
  stream.end();

  // await page1.pause();
});