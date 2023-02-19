import Papa from "papaparse";

const readFile = async (file: File): Promise<string> => {
  const reader = new FileReader();
  reader.readAsBinaryString(file);
  return new Promise((res, rej) => {
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => rej(reader.error);
  });
};

const round = (num: number) => Math.round(num * 10000) / 10000;

const getMinAndMax = (index: number, data: string[][]) => {
  const numbers = data.map((row) => Number(row[index]));
  return [round(Math.min(...numbers)), round(Math.max(...numbers))];
};

const generateFormula = (data: string[][]) => {
  const headerRow = data.find((row) => row[0] === "SubframeHeader");
  const fwhmIndex = headerRow.indexOf("FWHM");
  const eccentricityIndex = headerRow.indexOf("Eccentricity");
  const snrIndex = headerRow.indexOf("SNRWeight");
  const filtered = data.filter(
    (row) =>
      row[0] === "Subframe" &&
      Number(row[fwhmIndex]) <= 4 &&
      Number(row[eccentricityIndex]) <= 0.7
  );

  const [fwhmMin, fwhmMax] = getMinAndMax(fwhmIndex, filtered);
  const [eccentricityMin, eccentricityMax] = getMinAndMax(
    eccentricityIndex,
    filtered
  );
  const [snrMin, snrMax] = getMinAndMax(snrIndex, filtered);

  const formula = `27*(1-FWHM-${fwhmMin})/${
    fwhmMax - fwhmMin
  })+11*(1-(Eccentricity-${eccentricityMin})/${
    eccentricityMax - eccentricityMin
  })+22*(SNRWeight-${snrMin})/${snrMax - snrMin}+40`;

  return formula;
};

export const getFormula = async (file: File) => {
  const csvString = await readFile(file);
  const result = Papa.parse(csvString);
  // console.log(result.data)
  return generateFormula(result.data as string[][]);
};
