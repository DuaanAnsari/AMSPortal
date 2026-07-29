import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'src/utils/axios';

const MENU_ENDPOINT = '/api/MyOrders/GetUserMenus';

const cleanMenuName = (name) =>
  String(name ?? '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const normalizeName = (name) => cleanMenuName(name).toLowerCase();

function getNamedValue(object, name) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return undefined;

  const matchingEntry = Object.entries(object).find(
    ([key]) => normalizeName(key) === normalizeName(name)
  );

  return matchingEntry?.[1];
}

function getReportNames(menu, category) {
  const reports = getNamedValue(menu, 'Reports');
  const categoryReports = getNamedValue(reports, category);

  if (Array.isArray(categoryReports)) {
    return categoryReports.filter((item) => typeof item === 'string').map(cleanMenuName);
  }

  if (categoryReports && typeof categoryReports === 'object') {
    return Object.keys(categoryReports).map(cleanMenuName);
  }

  return [];
}

export function useUserReportOptions(category, existingOptions) {
  const { data: menu } = useSWR(MENU_ENDPOINT, fetcher);

  return useMemo(() => {
    const existingByName = new Map(
      existingOptions.map((option) => [normalizeName(option.label), option])
    );
    const categoryPrefix = `${normalizeName(category)} `;

    return getReportNames(menu, category)
      .map((reportName) => {
        const normalizedReportName = normalizeName(reportName);
        const nameWithoutCategory = normalizedReportName.startsWith(categoryPrefix)
          ? normalizedReportName.slice(categoryPrefix.length)
          : normalizedReportName;
        const existingOption =
          existingByName.get(normalizedReportName) ?? existingByName.get(nameWithoutCategory);

        return {
          id:
            existingOption?.id ??
            normalizedReportName
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
          label: reportName,
        };
      });
  }, [category, existingOptions, menu]);
}
