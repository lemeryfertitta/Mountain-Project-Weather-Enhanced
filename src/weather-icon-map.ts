/** Weather icons from https://github.com/basmilius/weather-icons */
import clearDay from "./weather-icons/clear-day.svg";
import sunriseIcon from "./weather-icons/sunrise.svg";
import sunsetIcon from "./weather-icons/sunset.svg";
import clearNight from "./weather-icons/clear-night.svg";
import drizzle from "./weather-icons/drizzle.svg";
import extremeRain from "./weather-icons/extreme-rain.svg";
import extremeSnow from "./weather-icons/extreme-snow.svg";
import fog from "./weather-icons/fog.svg";
import overcast from "./weather-icons/overcast.svg";
import partlyCloudyDay from "./weather-icons/partly-cloudy-day.svg";
import partlyCloudyNight from "./weather-icons/partly-cloudy-night.svg";
import rain from "./weather-icons/rain.svg";
import snow from "./weather-icons/snow.svg";
import thunderstorms from "./weather-icons/thunderstorms.svg";
import thunderstormsExtreme from "./weather-icons/thunderstorms-extreme.svg";

const weatherIconMap: Record<number, string> = {
  0: clearDay,
  1: partlyCloudyDay,
  2: partlyCloudyDay,
  3: overcast,
  45: fog,
  48: fog,
  51: drizzle,
  53: drizzle,
  55: drizzle,
  61: rain,
  63: rain,
  65: extremeRain,
  71: snow,
  73: snow,
  75: extremeSnow,
  77: snow,
  80: rain,
  81: rain,
  82: extremeRain,
  85: snow,
  86: extremeSnow,
  95: thunderstorms,
  96: thunderstormsExtreme,
  99: thunderstormsExtreme,
};

const weatherIconMapNight: Record<number, string> = {
  0: clearNight,
  1: partlyCloudyNight,
  2: partlyCloudyNight,
  3: overcast,
  45: fog,
  48: fog,
  51: drizzle,
  53: drizzle,
  55: drizzle,
  61: rain,
  63: rain,
  65: extremeRain,
  71: snow,
  73: snow,
  75: extremeSnow,
  77: snow,
  80: rain,
  81: rain,
  82: extremeRain,
  85: snow,
  86: extremeSnow,
  95: thunderstorms,
  96: thunderstormsExtreme,
  99: thunderstormsExtreme,
};

export function getWeatherIcon(code: number, isNight: boolean): string {
  if (isNight) {
    return weatherIconMapNight[code] || clearNight;
  }
  return weatherIconMap[code] || clearDay;
}

export function getSunriseIcon(): string {
  return sunriseIcon;
}

export function getSunsetIcon(): string {
  return sunsetIcon;
}
