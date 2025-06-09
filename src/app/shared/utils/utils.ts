export const formatDate = (date: Date): string => {
  return date ? date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
}

export const formatDateInvol = (date: Date): string => {
  try {
    return date ? date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
  } catch (error) {
    return date + ""
  }
}

export const formatDatetime = (date: Date): string => {
  return date ? date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
}

export const formatStringDatetime = (date: Date, hour: Date): string => {
  const dateFormatted = date ? date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
  const hourFormatted = hour ? `${hour.getHours().toString().padStart(2, '0')}:${hour.getMinutes().toString().padStart(2, '0')}` : '';
  const format = `${dateFormatted} ${hourFormatted}`
  return format
}

export const formatTime = (hour: Date): string => {
  const hourFormatted = hour ? `${hour.getHours().toString().padStart(2, '0')}:${hour.getMinutes().toString().padStart(2, '0')}` : '';
  return hourFormatted
}

export const getValidString = (value: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

export const formatDateText = (value: string): string => {

  const [date, time] = value.split(' ')
  const [hour, minute] = time.split(':')

  let formattedHour = Number(hour)
  let meridiem = 'AM'

  if (formattedHour >= 12) {
    formattedHour = formattedHour % 12;
    meridiem = 'PM';
  }

  if (formattedHour === 0) {
    formattedHour = 12;
  }
  return `${date} a las ${formattedHour.toString().padStart(2, '0')}:${minute} ${meridiem}`;
}

export const noQuotes = (event): boolean => {
  const charCode = event.charCode || event.keyCode || 0;
  const key = String.fromCharCode(charCode);
  if (key === "'" || key === '"') {
    return false
  }
  return true
}

export const getDateFromString = (value: string): Date => {
  if (value === null)
    return null
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date
}

export const formatDateString = (value: string): string => {
  const [year, month, day] = value.split('-');
  const date = day + "/" + month + "/" + year;
  return date;
}

export const validateDateTime = (dateTimeString: string): boolean => {
  const [dateComponents, timeComponents] = dateTimeString.split(' ');
  const [day, month, year] = dateComponents.split('/');
  const [hours, minutes, seconds] = timeComponents.split(':');
  const selectedDateTime = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
  const currentDateTime = new Date();
  return selectedDateTime <= currentDateTime;
}

export function quitarTildes(texto: string) {
  if (!texto) return '';
  const mapaTildes = {
    'á': 'a',
    'é': 'e',
    'í': 'i',
    'ó': 'o',
    'ú': 'u',
    'ü': 'u',
    // 'ñ': 'n',
    'Á': 'A',
    'É': 'E',
    'Í': 'I',
    'Ó': 'O',
    'Ú': 'U',
    'Ü': 'U',
    // 'Ñ': 'N'
  };

  return texto.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, letra => mapaTildes[letra] || letra);
}
