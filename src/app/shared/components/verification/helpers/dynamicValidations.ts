export default [
  {
    label: 'Dígito de verificación',
    checking: true,
    placeholder: '0',
    controlName: 'dniDigit',
    counter: 1,
    assets: [
      {
        img: 'assets/images/img_digito_dni_azul.png',
        caption: 'Ubicación del dígito de verificación en el DNI Azul'
      },
      {
        img: 'assets/images/img_digito_dni_electronico_2019.png',
        caption: 'Ubicación del dígito de verificación en el DNI Electrónico <strong> emitido hasta el 2019 </strong>'
      },
      {
        img: 'assets/images/img_digito_dni_electronico_2020.png',
        caption: 'Ubicación del dígito de verificación en el DNI Electrónico <strong> emitido a partir de 2020 </strong>'
      }
    ],
  },
  {
    label: 'Número de ubigeo en DNI',
    checking: true,
    placeholder: 'Ej.: 190512',
    controlName: 'ubigeoNumber',
    counter: 6,
    assets: [
      {

        img: 'assets/images/img_ubigeo_dni_azul.png',
        caption: 'Ubicación del número de ubigeo en DNI Azul'
      },
      {
        img: 'assets/images/img_ubigeo_dni_electronico_2019.png',
        caption: 'Ubicación del número de ubigeo en DNI Electrónico emitido hasta el 2019'
      },
      {
        img: 'assets/images/img_ubigeo_dni_electronico_2020.png',
        caption: 'Ubicación del número de ubigeo en DNI Electrónico emitido a partir de 2020'

      }
    ]
  },
  {
    label: 'Fecha de emisión del DNI',
    checking: true,
    placeholder: 'dd/mm/aaaa',
    controlName: 'dniEmitDate',
    assets: [
      {

        img: 'assets/images/img_emision_dni_azul.png',
        caption: 'Ubicación de la fecha de emisión en DNI Azul'
      },
      {
        img: 'assets/images/img_emision_dni_electronico_2019.png',
        caption: 'Ubicación de la fecha de emisión en DNI Electrónico emitido hasta el 2019'
      },
      {
        img: 'assets/images/img_emision_dni_electronico_2020.png',
        caption: 'Ubicación de la fecha de emisión en DNI Electrónico emitido a partir de 2020'
      }
    ]
  },
  {
    label: 'Nombre(s) de la madre',
    checking: true,
    placeholder: 'Nombres',
    controlName: 'motherName'
  },
  {
    label: 'Nombre(s) del padre',
    checking: true,
    placeholder: 'Nombres',
    controlName: 'fatherName'
  }
]

