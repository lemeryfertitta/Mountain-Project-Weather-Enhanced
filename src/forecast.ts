/** Weather data from Open Meteo https://open-meteo.com/ */
import { fetchWeatherApi } from "openmeteo";
const openMeteoBaseUrl = "https://api.open-meteo.com/v1/forecast";

export async function getWeatherData(
  latitude: number,
  longitude: number,
  unit: string
) {
  const params = {
    latitude: latitude,
    longitude: longitude,
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
  const timezone = response.timezone();
  const timezoneAbbreviation = response.timezoneAbbreviation();
  const utcOffsetSeconds = response.utcOffsetSeconds();

  console.log(
    `\nCoordinates: ${latitude}°N ${longitude}°E`,
    `\nTimezone: ${timezone} ${timezoneAbbreviation}`,
    `\nTimezone difference to GMT+0: ${utcOffsetSeconds}s`
  );

  return {
    hourly: {
      time: [
        ...Array(
          (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval()
        ),
      ].map(
        (_, i) =>
          new Date(
            (Number(hourly.time()) + i * hourly.interval()) *
              1000
          )
      ),
      temperature: hourly.variables(0)?.valuesArray() ?? [],
      weather_code: hourly.variables(1)?.valuesArray() ?? [],
      precipitation_probability: hourly.variables(2)?.valuesArray() ?? [],
      relative_humidity_2m: hourly.variables(3)?.valuesArray() ?? [],
      wind_speed: Array.from(hourly.variables(4)?.valuesArray() ?? []).map(
        Math.round
      ),
      wind_direction: Array.from(hourly.variables(5)?.valuesArray() ?? []).map(
        getCardinalDirection
      ),
    },
    daily: {
      time: [
        ...Array(
          (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval()
        ),
      ].map(
        (_, i) =>
          new Date(
            (Number(daily.time()) + i * daily.interval()) *
              1000
          )
      ),
      sunrise: sunrise
        ? [...Array(sunrise.valuesInt64Length())].map(
            (_, i) =>
              new Date(
                (Number(sunrise.valuesInt64(i))) * 1000
              )
          )
        : [],
      sunset: [...Array(sunset.valuesInt64Length())].map(
        (_, i) =>
          new Date((Number(sunset.valuesInt64(i))) * 1000)
      ),
      weather_code: daily.variables(2)?.valuesArray() ?? [],
      temperature_2m_max: daily.variables(3)?.valuesArray() ?? [],
    },
    timezone: response.timezone(),
  };
}

export function getMostCommonWeatherCodeForDay(
  time: Date[],
  weathercodes: Float32Array | never[],
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

function getCardinalDirection(angle: number): string {
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
