import {
    iUsers, iClose, iSearch, iAlertHexagonal, iCalendarClean, iClockDots,
    iFileRegister, iInfoCircle, iPlayCircle, iReset, iSearchMpe, iSmartPhone,
    iTracing, iTrashMpe, iPhone, iMail, iArrowRight, iArrowLeft,
    iAlert, iCheckCircle, iDownloadFile, iFile
} from 'ngx-mpfn-dev-icojs-regular';

const ICONOS = [
    { nombre: 'iAlertHexagonal', icono: iAlertHexagonal },
    { nombre: 'iCalendarClean', icono: iCalendarClean },
    { nombre: 'iClockDots', icono: iClockDots },
    { nombre: 'iFileRegister', icono: iFileRegister },
    { nombre: 'iInfoCircle', icono: iInfoCircle },
    { nombre: 'iPlayCircle', icono: iPlayCircle },
    { nombre: 'iReset', icono: iReset },
    { nombre: 'iSearchMpe', icono: iSearchMpe },
    { nombre: 'iSmartPhone', icono: iSmartPhone },
    { nombre: 'iTracing', icono: iTracing },
    { nombre: 'iTrashMpe', icono: iTrashMpe },
    { nombre: 'iPhone', icono: iPhone },
    { nombre: 'iMail', icono: iMail },
    { nombre: 'iArrowRight', icono: iArrowRight },
    { nombre: 'iArrowLeft', icono: iArrowLeft },
    { nombre: 'iAlert', icono: iAlert },
    { nombre: 'iCheckCircle', icono: iCheckCircle },
    { nombre: 'iClose', icono: iClose },
    { nombre: 'iSearch', icono: iSearch },
    { nombre: 'iUsers', icono: iUsers },
    { nombre: 'iDownloadFile', icono: iDownloadFile },
    { nombre: 'iFile', icono: iFile },
]

export const obtenerIcono = (nombre: string) => {
    return ICONOS.find(icono => icono.nombre === nombre)?.icono
};
