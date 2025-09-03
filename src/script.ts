import { getWeatherData, getMostCommonWeatherCodeForDay } from "./forecast.js";
import {
  getSunriseIcon,
  getSunsetIcon,
  getWeatherIcon,
} from "./weather-icon-map.js";

const daysToForecast = 7;

async function renderForecastFromApi(
  latitude: number,
  longitude: number,
  unit: string
) {
  const weather = await getWeatherData(latitude, longitude, unit);
  const tempUnitSymbol = unit === "metric" ? "C" : "F";
  const windSpeedUnitSymbol = unit === "metric" ? "m/s" : "mph";

  const timeZone = weather.timezone;
  for (let daysFromToday = 0; daysFromToday < daysToForecast; daysFromToday++) {
    const day = weather.daily.time[daysFromToday]!;
    const mostCommonCode = getMostCommonWeatherCodeForDay(
      weather.hourly.time,
      weather.hourly.weather_code,
      weather.daily.sunrise[daysFromToday],
      weather.daily.sunset[daysFromToday]
    );
    const iconName = getWeatherIcon(mostCommonCode, false);
    const max = Math.round(weather.daily.temperature_2m_max[daysFromToday]!);
    const dayButton = document.getElementById(
      `day-button-${daysFromToday}`
    ) as HTMLButtonElement | null;
    if (!dayButton) continue;

    const nameDiv = document.createElement("div");
    const dayName = day.toLocaleDateString(undefined, {
      weekday: "short",
      timeZone: timeZone ?? undefined,
    });
    const toggleIconSpan = document.createElement("span");
    toggleIconSpan.id = `day-toggle-${daysFromToday}`;
    toggleIconSpan.textContent = "⏵ ";

    const dayNameSpan = document.createElement("span");
    dayNameSpan.textContent = dayName;
    nameDiv.appendChild(toggleIconSpan);
    nameDiv.appendChild(dayNameSpan);

    const iconElement = document.createElement("img");
    iconElement.src = iconName;
    iconElement.alt = "Weather icon";
    iconElement.height = 36;
    iconElement.width = 36;

    const tempDiv = document.createElement("div");
    tempDiv.textContent = `${max}°${tempUnitSymbol}`;

    dayButton.appendChild(nameDiv);
    dayButton.appendChild(iconElement);
    dayButton.appendChild(tempDiv);

    dayButton.onclick = () => {
      const hourlyForecast = document.getElementById("hourly-forecast");
      if (!hourlyForecast) {
        throw new Error("MPWE: Hourly forecast element not found");
      }
      const prevDisplayedDayIndex = hourlyForecast.getAttribute(
        "data-displayed-day-index"
      );
      const prevDisplayedDayToggle = document.getElementById(
        `day-toggle-${prevDisplayedDayIndex}`
      );
      if (prevDisplayedDayToggle) {
        prevDisplayedDayToggle.textContent = "⏵ ";
      }
      if (prevDisplayedDayIndex === daysFromToday.toString()) {
        hourlyForecast.style.display = "none";
        hourlyForecast.setAttribute("data-displayed-day-index", "-1");
        return;
      } else {
        const dayToggle = document.getElementById(
          `day-toggle-${daysFromToday}`
        );
        if (dayToggle) {
          dayToggle.textContent = "⏷ ";
        }
      }
      const formattedDate = day.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: timeZone ?? undefined,
      });
      const collapseTitle = document.getElementById("collapse-title");
      if (collapseTitle) {
        collapseTitle.textContent = `Hourly forecast for ${formattedDate}`;
      }
      const hourlyTableBody = document.getElementById(
        "hourly-list"
      ) as HTMLElement | null;
      if (!hourlyTableBody) return;
      hourlyTableBody.innerHTML = "";
      const sunrise = weather.daily.sunrise[daysFromToday]!;
      const sunset = weather.daily.sunset[daysFromToday]!;
      let sunriseRowToFocus: HTMLTableRowElement | null = null;
      for (let h = 0; h < (weather.hourly.time?.length ?? 0); h++) {
        const hourDate = weather.hourly.time[h];
        if (
          !hourDate ||
          hourDate.toLocaleDateString(undefined, {
            timeZone: timeZone ?? undefined,
          }) !==
            day.toLocaleDateString(undefined, {
              timeZone: timeZone ?? undefined,
            })
        ) {
          continue;
        }
        const hourStr = hourDate.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: timeZone ?? undefined,
        });
        const temp = Math.round(weather.hourly.temperature?.[h] ?? 0);
        const code = weather.hourly.weather_code?.[h] ?? 0;
        let isNight = false;
        if (sunrise instanceof Date && sunset instanceof Date) {
          isNight = hourDate < sunrise || hourDate >= sunset;
        }
        const iconNameHourly = getWeatherIcon(code, isNight);
        const precip = weather.hourly.precipitation_probability?.[h] ?? null;
        const humidity = weather.hourly.relative_humidity_2m?.[h] ?? null;
        const wind_speed = weather.hourly.wind_speed?.[h];
        const wind_direction = weather.hourly.wind_direction?.[h] ?? null;

        const tr = document.createElement("tr");

        const tdHour = document.createElement("td");
        tdHour.textContent = hourStr;

        if (
          sunrise instanceof Date &&
          hourDate.getHours() === sunrise.getHours()
        ) {
          const sunriseSpan = document.createElement("span");
          sunriseSpan.style.color = "orange";
          sunriseSpan.innerText =
            sunrise.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: timeZone ?? undefined,
            }) + " ";
          const sunriseImg = document.createElement("img");
          sunriseImg.src = getSunriseIcon();
          sunriseImg.alt = "Sunrise";
          sunriseImg.width = 18;
          sunriseImg.height = 18;
          sunriseImg.style.verticalAlign = "middle";
          sunriseSpan.appendChild(sunriseImg);
          tdHour.appendChild(document.createElement("br"));
          tdHour.appendChild(sunriseSpan);
          sunriseRowToFocus = tr;
        }
        if (
          sunset instanceof Date &&
          hourDate.getHours() === sunset.getHours()
        ) {
          const sunsetSpan = document.createElement("span");
          sunsetSpan.style.color = "purple";
          sunsetSpan.innerText =
            sunset.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: timeZone ?? undefined,
            }) + " ";
          const sunsetImg = document.createElement("img");
          sunsetImg.src = getSunsetIcon();
          sunsetImg.alt = "Sunset";
          sunsetImg.width = 18;
          sunsetImg.height = 18;
          sunsetImg.style.verticalAlign = "middle";
          sunsetSpan.appendChild(sunsetImg);
          tdHour.appendChild(document.createElement("br"));
          tdHour.appendChild(sunsetSpan);
        }
        tr.appendChild(tdHour);

        const tdIcon = document.createElement("td");
        const iconEl = document.createElement("img");
        iconEl.src = iconNameHourly;
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
        if (precip !== null) {
          const spanPrecip = document.createElement("span");
          spanPrecip.textContent = `${precip}%`;
          tdPrecip.appendChild(spanPrecip);
        } else {
          tdPrecip.textContent = "-";
        }
        tr.appendChild(tdPrecip);

        const tdHumidity = document.createElement("td");
        tdHumidity.title = "Humidity";
        if (humidity !== null) {
          const spanHumidity = document.createElement("span");
          spanHumidity.textContent = `${humidity}%`;
          tdHumidity.appendChild(spanHumidity);
        } else {
          tdHumidity.textContent = "-";
        }
        tr.appendChild(tdHumidity);

        const tdWind = document.createElement("td");
        tdWind.title = "Wind";
        if (wind_speed !== null) {
          const spanWind = document.createElement("span");
          spanWind.textContent = `${wind_speed} ${windSpeedUnitSymbol}`;
          if (wind_direction) {
            spanWind.textContent += ` ${wind_direction}`;
          }
          tdWind.appendChild(spanWind);
        } else {
          tdWind.textContent = "-";
        }
        tr.appendChild(tdWind);

        hourlyTableBody.appendChild(tr);
      }
      hourlyForecast.style.display = "block";
      hourlyForecast.setAttribute(
        "data-displayed-day-index",
        daysFromToday.toString()
      );
      if (sunriseRowToFocus) {
        const hourlyDiv = document.getElementById("hourly-div");
        if (hourlyDiv) {
          hourlyDiv.scrollTop = sunriseRowToFocus.offsetTop;
        }
      }
    };
  }
}
function createWidgetContainer(): HTMLElement {
  const container = document.createElement("div");
  container.id = "mp-weather-enhanced-widget";
  container.classList.add("mt-1", "inline-block");

  const dailyTable = document.createElement("table");
  dailyTable.id = "forecast-days-table";
  const dailyTbody = document.createElement("tbody");
  const row = document.createElement("tr");
  for (let i = 0; i < 7; i++) {
    const td = document.createElement("td");
    const btn = document.createElement("button");
    btn.id = `day-button-${i}`;
    btn.classList.add("btn", "btn-primary", "btn-xs");
    btn.style.whiteSpace = "nowrap";
    btn.type = "button";
    td.appendChild(btn);
    row.appendChild(td);
  }
  dailyTbody.appendChild(row);
  dailyTable.appendChild(dailyTbody);
  container.appendChild(dailyTable);

  const collapse = document.createElement("div");
  collapse.id = "hourly-forecast";
  collapse.style.display = "none";
  collapse.classList.add("mt-1");
  collapse.setAttribute("data-displayed-day-index", "-1");
  const collapseTitle = document.createElement("h3");
  collapseTitle.id = "collapse-title";

  const hourlyDiv = document.createElement("div");
  hourlyDiv.id = "hourly-div";
  hourlyDiv.style.maxHeight = "300px";
  hourlyDiv.style.overflowX = "hidden";
  hourlyDiv.style.overflowY = "scroll";

  const hourlyTable = document.createElement("table");
  hourlyTable.id = "hourly-table";
  hourlyTable.classList.add("table", "table-striped", "table-condensed");

  const thead = document.createElement("thead");
  thead.style.position = "sticky";
  thead.style.top = "0";
  thead.style.zIndex = "1";

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
  hourlyDiv.appendChild(hourlyTable);

  collapse.appendChild(collapseTitle);
  collapse.appendChild(hourlyDiv);
  container.appendChild(collapse);
  return container;
}

function injectWeatherWidget(
  weatherDiv: HTMLElement,
  latitude: number,
  longitude: number
) {
  weatherDiv.style.display = "none";
  const widget = createWidgetContainer();
  if (weatherDiv && weatherDiv.parentNode) {
    weatherDiv.parentNode.insertBefore(widget, weatherDiv);
  } else {
    document.body.prepend(widget);
  }
  const units = getUnits();
  renderForecastFromApi(latitude, longitude, units);
}

function getUnits() {
  const imperial = document.getElementsByClassName("imperial");
  const imperialElement = imperial[0] as HTMLElement | undefined;
  if (
    imperialElement &&
    window.getComputedStyle(imperialElement, null).display === "none"
  ) {
    return "metric";
  }
  return "imperial";
}

function getCoordinates(): [number, number] {
  const gpsTd = document.evaluate(
    "//td[contains(text(),'GPS:')]",
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
  const gps = gpsTd?.nextSibling?.nextSibling?.textContent;
  const [latitude, longitude] =
    gps?.split(",").map((coord) => parseFloat(coord.trim())) || [];
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    throw new Error("MPWE: Unable to parse GPS coordinates");
  }
  return [latitude, longitude];
}

function getWeatherDiv(): HTMLElement {
  const weatherDiv = document.getElementById("weather");
  if (!weatherDiv) {
    throw new Error("MPWE: Weather div not found");
  }
  return weatherDiv;
}

const weatherDiv = getWeatherDiv();
const [latitude, longitude] = getCoordinates();
injectWeatherWidget(weatherDiv, latitude, longitude);
