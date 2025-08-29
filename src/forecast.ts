/** Weather icons from https://github.com/basmilius/weather-icons */
import clearDay from "./weather_icons/clear-day.svg";
import sunriseIconUrl from "./weather_icons/sunrise.svg";
import sunsetIconUrl from "./weather_icons/sunset.svg";
import clearNight from "./weather_icons/clear-night.svg";
import drizzle from "./weather_icons/drizzle.svg";
import extremeRain from "./weather_icons/extreme-rain.svg";
import extremeSnow from "./weather_icons/extreme-snow.svg";
import fog from "./weather_icons/fog.svg";
import overcast from "./weather_icons/overcast.svg";
import partlyCloudyDay from "./weather_icons/partly-cloudy-day.svg";
import partlyCloudyNight from "./weather_icons/partly-cloudy-night.svg";
import rain from "./weather_icons/rain.svg";
import snow from "./weather_icons/snow.svg";
import thunderstorms from "./weather_icons/thunderstorms.svg";
import thunderstormsExtreme from "./weather_icons/thunderstorms-extreme.svg";

/** Weather data from Open Meteo https://open-meteo.com/ */
import { fetchWeatherApi } from "openmeteo";
const openMeteoBaseUrl = "https://api.open-meteo.com/v1/forecast";

const defaultLatLong = { latitude: 49.7016, longitude: -123.1558 };
const daysToForecast = 7;

const modalTitle = document.getElementById("modal-title") as HTMLElement;

async function getWeatherData(lat: number, lon: number, unit: string) {
  const params = {
    latitude: lat,
    longitude: lon,
    hourly: [
      "temperature_2m",
      "weathercode",
      "precipitation_probability",
      "relative_humidity_2m",
      "windspeed_10m",
      "winddirection_10m",
    ],
    daily: ["sunrise", "sunset", "weathercode", "temperature_2m_max"],
    timezone: "auto",
    temperature_unit: unit === "metric" ? "celsius" : "fahrenheit",
    wind_speed_unit: unit === "metric" ? "ms" : "mph",
  };
  const url = openMeteoBaseUrl;
  const responses = await fetchWeatherApi(url, params);
  const response = responses[0]!;
  const hourly = response.hourly()!;
  const daily = response.daily()!;
  const sunrise = daily.variables(0)!;
  const sunset = daily.variables(1)!;
  return {
    hourly: {
      time: [
        ...Array(
          (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval()
        ),
      ].map(
        (_, i) =>
          new Date((Number(hourly.time()) + i * hourly.interval()) * 1000)
      ),
      temperature: hourly.variables(0)?.valuesArray() ?? [],
      weathercode: hourly.variables(1)?.valuesArray() ?? [],
      precipitation_probability: hourly.variables(2)?.valuesArray() ?? [],
      relative_humidity_2m: hourly.variables(3)?.valuesArray() ?? [],
      windspeed_10m: hourly.variables(4)?.valuesArray() ?? [],
      winddirection_10m: hourly.variables(5)?.valuesArray() ?? [],
    },
    daily: {
      time: [
        ...Array(
          (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval()
        ),
      ].map(
        (_, i) => new Date((Number(daily.time()) + i * daily.interval()) * 1000)
      ),
      sunrise: [...Array(sunrise.valuesInt64Length())].map(
        (_, i) => new Date(Number(sunrise.valuesInt64(i)) * 1000)
      ),
      sunset: [...Array(sunset.valuesInt64Length())].map(
        (_, i) => new Date(Number(sunset.valuesInt64(i)) * 1000)
      ),
      weathercode: daily.variables(2)?.valuesArray() ?? [],
      temperature_2m_max: daily.variables(3)?.valuesArray() ?? [],
    },
    timezone: response.timezone(),
  };
}

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

function getCardinalDirection(angle: number | null): string {
  if (angle == null || isNaN(angle)) return "-";
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const idx = Math.round((angle % 360) / 22.5) % 16;
  return directions[idx] ?? "-";
}

async function renderForecastFromApi(unit: string) {
  const weather = await getWeatherData(
    defaultLatLong.latitude,
    defaultLatLong.longitude,
    unit
  );
  console.log(weather);
  const tempUnitSymbol = unit === "metric" ? "C" : "F";
  const windSpeedUnitSymbol = unit === "metric" ? "m/s" : "mph";
  // Get timezone from API response if available
  const timezone = weather.timezone!;

  for (let daysFromToday = 0; daysFromToday < daysToForecast; daysFromToday++) {
    const day = weather.daily.time[daysFromToday]!;
    const mostCommonCode = getMostCommonWeatherCodeForDay(
      weather.hourly.time,
      weather.hourly.weathercode,
      day
    );
    const iconName =
      weatherIconMap[mostCommonCode] || "meteocons:clear-day-fill";
    const max = Math.round(weather.daily.temperature_2m_max[daysFromToday]!);
    // Select the card button from HTML
    const dayDiv = document.getElementById(
      `day-card-${daysFromToday}`
    )! as HTMLButtonElement;
    dayDiv.innerHTML = "";
    dayDiv.onclick = null;
    dayDiv.classList.add("hover:bg-blue-100");

    const nameDiv = document.createElement("div");
    nameDiv.className = "font-bold mb-2 text-blue-700";
    nameDiv.textContent = day.toLocaleDateString(undefined, {
      weekday: "short",
      timeZone: timezone,
    });

    const iconElement = document.createElement("img");
    iconElement.src = iconName;
    iconElement.alt = "Weather icon";
    iconElement.className = "my-1";

    const tempDiv = document.createElement("div");
    tempDiv.className = "text-lg text-gray-600 mt-1 font-semibold";
    tempDiv.textContent = `${max}°${tempUnitSymbol}`;

    dayDiv.appendChild(nameDiv);
    dayDiv.appendChild(iconElement);
    dayDiv.appendChild(tempDiv);

    // Modal logic for hourly forecast
    dayDiv.onclick = () => {
      const formattedDate = day.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: timezone,
      });
      modalTitle.textContent = formattedDate;
      // Use hourly data from weather.hourly
      const hourlyTableBody = document.getElementById(
        "hourly-list"
      ) as HTMLElement | null;
      if (!hourlyTableBody) return;
      hourlyTableBody.innerHTML = "";
      // Filter hourly data for the selected day
      const sunrise = weather.daily.sunrise[daysFromToday]!;
      const sunset = weather.daily.sunset[daysFromToday]!;
      for (let h = 0; h < (weather.hourly.time?.length ?? 0); h++) {
        const hourDate = weather.hourly.time[h];
        if (
          !hourDate ||
          hourDate.getFullYear() !== day.getFullYear() ||
          hourDate.getMonth() !== day.getMonth() ||
          hourDate.getDate() !== day.getDate()
        ) {
          continue;
        }
        const hourStr = hourDate.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });
        const temp = Math.round(weather.hourly.temperature?.[h] ?? 0);
        const code = weather.hourly.weathercode?.[h] ?? 0;
        let isNight = false;
        if (sunrise instanceof Date && sunset instanceof Date) {
          isNight = hourDate < sunrise || hourDate >= sunset;
        }
        const iconNameHourly = isNight
          ? weatherIconMapNight[code]
          : weatherIconMap[code];
        const fallbackIcon = clearDay;
        const precip = weather.hourly.precipitation_probability?.[h] ?? null;
        const humidity = weather.hourly.relative_humidity_2m?.[h] ?? null;
        const windspeedRaw = weather.hourly.windspeed_10m?.[h];
        const windspeed =
          typeof windspeedRaw === "number" ? Math.round(windspeedRaw) : null;
        const winddir = weather.hourly.winddirection_10m?.[h] ?? null;
        const cardinal = getCardinalDirection(winddir ?? null);

        // Create table row and cells
        const tr = document.createElement("tr");
        tr.className = "hover:bg-blue-50";

        const tdHour = document.createElement("td");
        tdHour.textContent = hourStr;
        tdHour.className = "py-2 px-2 font-medium";
        tr.appendChild(tdHour);

        const tdIcon = document.createElement("td");
        tdIcon.className = "text-center py-2 px-2";
        const iconEl = document.createElement("img");
        iconEl.src = iconNameHourly || fallbackIcon;
        iconEl.width = 36;
        iconEl.height = 36;
        iconEl.alt = "Weather icon";
        tdIcon.appendChild(iconEl);
        tr.appendChild(tdIcon);

        const tdTemp = document.createElement("td");
        tdTemp.textContent = `${temp}°${tempUnitSymbol}`;
        tdTemp.className = "py-2 px-2 font-semibold";
        tr.appendChild(tdTemp);

        const tdPrecip = document.createElement("td");
        tdPrecip.title = "Precipitation Probability";
        tdPrecip.className = "py-2 px-2";
        tdPrecip.innerHTML =
          precip !== null
            ? `<span>${precip}%</span>`
            : "-";
        tr.appendChild(tdPrecip);

        const tdHumidity = document.createElement("td");
        tdHumidity.title = "Humidity";
        tdHumidity.className = "py-2 px-2";
        tdHumidity.innerHTML =
          humidity !== null
            ? `<span>${humidity}%</span>`
            : "-";
        tr.appendChild(tdHumidity);

        const tdWind = document.createElement("td");
        tdWind.title = "Wind";
        tdWind.className = "py-2 px-2";
        if (windspeed !== null && cardinal !== "-") {
          tdWind.innerHTML = `<span'>${windspeed} ${windSpeedUnitSymbol} ${cardinal}</span>`;
        } else if (windspeed !== null) {
          tdWind.innerHTML = `<span>${windspeed} ${windSpeedUnitSymbol}</span>`;
        } else if (cardinal !== "-") {
          tdWind.innerHTML = `<span>${cardinal}</span>`;
        } else {
          tdWind.textContent = "-";
        }
        tr.appendChild(tdWind);

        if (
          sunrise instanceof Date &&
          hourDate.getHours() === sunrise.getHours()
        ) {
          const sunriseRow = document.createElement("tr");
          sunriseRow.className = "bg-yellow-50 text-yellow-700 font-bold";
          const sunriseTd = document.createElement("td");
          sunriseTd.colSpan = 7;
          sunriseTd.className = "flex justify-center";

          const sunriseTime = document.createElement("span");
          sunriseTime.textContent = sunrise.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
          sunriseTd.appendChild(sunriseTime);

          const sunriseImg = document.createElement("img");
          sunriseImg.src = sunriseIconUrl;
          sunriseImg.width = 24;
          sunriseImg.height = 24;
          sunriseImg.alt = "Sunrise icon";
          sunriseTd.appendChild(sunriseImg);
          sunriseRow.appendChild(sunriseTd);
          sunriseRow.classList.add("border-b");
          hourlyTableBody.appendChild(tr);
          hourlyTableBody.appendChild(sunriseRow);
        } else if (
          sunset instanceof Date &&
          hourDate.getHours() === sunset.getHours()
        ) {
          const sunsetRow = document.createElement("tr");
          sunsetRow.className = "bg-purple-50 text-purple-700 font-bold";
          const sunsetTd = document.createElement("td");
          sunsetTd.colSpan = 7;
          sunsetTd.className =
            "text-center flex items-center justify-center";

          const sunsetTime = document.createElement("span");
          sunsetTime.textContent = sunset.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
          sunsetTd.appendChild(sunsetTime);

          const sunsetImg = document.createElement("img");
          sunsetImg.src = sunsetIconUrl;
          sunsetImg.width = 24;
          sunsetImg.height = 24;
          sunsetImg.alt = "Sunset icon";
          sunsetTd.appendChild(sunsetImg);
          sunsetRow.appendChild(sunsetTd);
          sunsetRow.classList.add("border-b");
          hourlyTableBody.appendChild(tr);
          hourlyTableBody.appendChild(sunsetRow);
        } else {
          tr.classList.add("border-b");
          hourlyTableBody.appendChild(tr);
        }
      }
    };
  }
}

renderForecastFromApi("imperial");
function getMostCommonWeatherCodeForDay(
  time: Date[],
  weathercodes: Float32Array | never [],
  day: Date
): number {
  // Filter weather codes for the given day
  const codesForDay: number[] = [];
  for (let i = 0; i < time.length; i++) {
    const t = time[i]!;
    if (
      t.getFullYear() === day.getFullYear() &&
      t.getMonth() === day.getMonth() &&
      t.getDate() === day.getDate()
    ) {
      codesForDay.push(weathercodes[i]!);
    }
  }
  // Count occurrences
  const freq: Record<number, number> = {};
  for (const code of codesForDay) {
    freq[code] = (freq[code] || 0) + 1;
  }
  // Find most common code
  let mostCommon = codesForDay[0] ?? 0;
  let maxCount = 0;
  for (const code in freq) {
    if (freq[code]! > maxCount) {
      maxCount = freq[code]!;
      mostCommon = Number(code);
    }
  }
  return mostCommon;
}

