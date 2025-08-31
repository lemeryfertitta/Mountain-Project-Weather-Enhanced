// ...existing imports...
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

import { getWeatherData, getMostCommonWeatherCodeForDay } from "./forecast.js";

const defaultLatLong = { latitude: 49.7016, longitude: -123.1558 };
const daysToForecast = 7;

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


export async function renderForecastFromApi(unit: string) {
  const weather = await getWeatherData(
    defaultLatLong.latitude,
    defaultLatLong.longitude,
    unit
  );
  const tempUnitSymbol = unit === "metric" ? "C" : "F";
  const windSpeedUnitSymbol = unit === "metric" ? "m/s" : "mph";
  // Get timezone from API response if available
  const timezone = weather.timezone!;

  for (let daysFromToday = 0; daysFromToday < daysToForecast; daysFromToday++) {
    const day = weather.daily.time[daysFromToday]!;
    const mostCommonCode = getMostCommonWeatherCodeForDay(
      weather.hourly.time,
      weather.hourly.weather_code,
      day
    );
    const iconName =
      weatherIconMap[mostCommonCode] || "meteocons:clear-day-fill";
    const max = Math.round(weather.daily.temperature_2m_max[daysFromToday]!);
    // Select the card button from HTML
    const dayDiv = document.getElementById(
      `day-card-${daysFromToday}`
    ) as HTMLButtonElement | null;
    if (!dayDiv) continue;
    dayDiv.innerHTML = "";
    dayDiv.onclick = null;

    const nameDiv = document.createElement("div");
    nameDiv.textContent = day.toLocaleDateString(undefined, {
      weekday: "short",
      timeZone: timezone,
    });

    const iconElement = document.createElement("img");
    iconElement.src = iconName;
    iconElement.alt = "Weather icon";

    const tempDiv = document.createElement("div");
    tempDiv.textContent = `${max}°${tempUnitSymbol}`;

    dayDiv.appendChild(nameDiv);
    dayDiv.appendChild(iconElement);
    dayDiv.appendChild(tempDiv);

    // Vanilla JS collapse logic for hourly forecast
    dayDiv.onclick = () => {
      const formattedDate = day.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: timezone,
      });
      const collapseTitle = document.getElementById("collapse-title");
      if (collapseTitle) {
        collapseTitle.textContent = formattedDate;
      }
      const hourlyTableBody = document.getElementById("hourly-list") as HTMLElement | null;
      if (!hourlyTableBody) return;
      hourlyTableBody.innerHTML = "";
      const sunrise = weather.daily.sunrise[daysFromToday]!;
      const sunset = weather.daily.sunset[daysFromToday]!;
      let sunriseRowToFocus: HTMLTableRowElement | null = null;
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
        const code = weather.hourly.weather_code?.[h] ?? 0;
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
        const wind_speed = weather.hourly.wind_speed?.[h];
        const wind_direction = weather.hourly.wind_direction?.[h] ?? null;

        // Create table row and cells
        const tr = document.createElement("tr");

        const tdHour = document.createElement("td");
        tdHour.textContent = hourStr;
        tr.appendChild(tdHour);

        const tdIcon = document.createElement("td");
        const iconEl = document.createElement("img");
        iconEl.src = iconNameHourly || fallbackIcon;
        iconEl.width = 36;
        iconEl.height = 36;
        iconEl.alt = "Weather icon";
        tdIcon.appendChild(iconEl);
        tr.appendChild(tdIcon);

        const tdTemp = document.createElement("td");
        tdTemp.textContent = `${temp}°${tempUnitSymbol}`;
        tr.appendChild(tdTemp);

        const tdPrecip = document.createElement("td");
        tdPrecip.title = "Precipitation Probability";
        tdPrecip.innerHTML =
          precip !== null
            ? `<span>${precip}%</span>`
            : "-";
        tr.appendChild(tdPrecip);

        const tdHumidity = document.createElement("td");
        tdHumidity.title = "Humidity";
        tdHumidity.innerHTML =
          humidity !== null
            ? `<span>${humidity}%</span>`
            : "-";
        tr.appendChild(tdHumidity);

        const tdWind = document.createElement("td");
        tdWind.title = "Wind";
        if (wind_speed !== null) {
          tdWind.innerHTML = `<span'>${wind_speed} ${windSpeedUnitSymbol} ${wind_direction}</span>`;
        } else if (wind_speed !== null) {
          tdWind.innerHTML = `<span>${wind_speed} ${windSpeedUnitSymbol}</span>`;
        } else {
          tdWind.textContent = "-";
        }
        tr.appendChild(tdWind);

        if (
          sunrise instanceof Date &&
          hourDate.getHours() === sunrise.getHours()
        ) {
          const sunriseRow = document.createElement("tr");
          sunriseRow.tabIndex = -1;
          const sunriseTd = document.createElement("td");
          sunriseTd.colSpan = 7;

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
          hourlyTableBody.appendChild(tr);
          hourlyTableBody.appendChild(sunriseRow);
          sunriseRowToFocus = sunriseRow;
        } else if (
          sunset instanceof Date &&
          hourDate.getHours() === sunset.getHours()
        ) {
          const sunsetRow = document.createElement("tr");
          const sunsetTd = document.createElement("td");
          sunsetTd.colSpan = 7;

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
          hourlyTableBody.appendChild(tr);
          hourlyTableBody.appendChild(sunsetRow);
        } else {
          hourlyTableBody.appendChild(tr);
        }
      }
      // Show collapse after data is rendered
      const collapseEl = document.getElementById('hourlyCollapse');
      if (collapseEl) {
        collapseEl.style.display = 'block';
      }
      // Scroll the sunrise row to the top of the list if present
      if (sunriseRowToFocus) {
        const hourlyTableBody = document.getElementById("hourly-list");
        if (hourlyTableBody) {
          sunriseRowToFocus.scrollIntoView({ behavior: "auto", block: "start" });
        }
      }
    };
  }
}

window.addEventListener("DOMContentLoaded", () => {

  function createWidgetContainer(): HTMLElement {
    const container = document.createElement("div");
    container.id = "mp-weather-enhanced-widget";

    // Forecast grid
    const grid = document.createElement("div");
    grid.id = "forecast-days";
    for (let i = 0; i < 7; i++) {
      const btn = document.createElement("button");
      btn.id = `day-card-${i}`;
      btn.type = "button";
      grid.appendChild(btn);
    }
    container.appendChild(grid);

    // Vanilla collapse for hourly forecast
    const collapse = document.createElement("div");
    collapse.id = "hourlyCollapse";
      collapse.style.display = "none";
      // Create collapse content using JS instead of innerHTML
      const collapseTitle = document.createElement("h3");
      collapseTitle.id = "collapse-title";

      const tableWrapper = document.createElement("div");
      tableWrapper.style.maxHeight = "200px";
      tableWrapper.style.overflowX = "hidden";
      tableWrapper.style.overflowY = "scroll";

      const hourlyTable = document.createElement("table");
      hourlyTable.id = "hourly-table";

      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      const headers = ["Time", "Weather", "Temp", "Precip", "Humidity", "Wind"];
      for (const text of headers) {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);

      const tbody = document.createElement("tbody");
      tbody.id = "hourly-list";

      hourlyTable.appendChild(thead);
      hourlyTable.appendChild(tbody);
      tableWrapper.appendChild(hourlyTable);

      collapse.appendChild(collapseTitle);
      collapse.appendChild(tableWrapper);
    container.appendChild(collapse);
    return container;
  }

  function injectWeatherWidget(weatherDiv: HTMLElement) {
    weatherDiv.style.display = "none";
    const widget = createWidgetContainer();
    if (weatherDiv && weatherDiv.parentNode) {
      weatherDiv.parentNode.insertBefore(widget, weatherDiv);
    } else {
      document.body.prepend(widget);
    }
    renderForecastFromApi('imperial');
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        const weatherDiv = document.getElementById("weather");
        if (weatherDiv) {
          observer.disconnect();
          injectWeatherWidget(weatherDiv);
          break;
        }
      }
    }
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
});
