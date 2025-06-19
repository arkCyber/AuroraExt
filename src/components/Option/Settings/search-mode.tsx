import { SaveButton } from "@/components/Common/SaveButton2"
import { getSearchSettings, setSearchSettings } from "@/services/search"
import { ALL_GOOGLE_DOMAINS } from "@/utils/google-domains"
import { SUPPORTED_SERACH_PROVIDERS } from "@/utils/search-provider"
import { useForm } from "@mantine/form"
import { useQuery } from "@tanstack/react-query"
import { Select, Skeleton, Switch, InputNumber, Input } from "antd"
import { useTranslation } from "react-i18next"

export const SearchModeSettings = () => {
  const { t } = useTranslation("settings")

  const form = useForm({
    initialValues: {
      isSimpleInternetSearch: false,
      searchProvider: "",
      totalSearchResults: 0,
      visitSpecificWebsite: false,
      searxngURL: "",
      searxngJSONMode: false,
      braveApiKey: "",
      googleDomain: "",
      defaultInternetSearchOn: false
    }
  })

  const { status } = useQuery({
    queryKey: ["fetchSearchSettings"],
    queryFn: async () => {
      const data = await getSearchSettings()
      form.setValues(data)
      return data
    }
  })

  if (status === "pending" || status === "error") {
    return <Skeleton active />
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
          {t("generalSettings.webSearch.heading")}
        </h2>
        <div className="mt-3 border border-b border-gray-200 dark:border-gray-600"></div>
      </div>
      <form
        onSubmit={form.onSubmit(async (values) => {
          await setSearchSettings(values)
        })}
        className="space-y-2">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between">
          <span className="text-gray-700 dark:text-neutral-50 ">
            {t("generalSettings.webSearch.provider.label")}
          </span>
          <div>
            <Select
              placeholder={t("generalSettings.webSearch.provider.placeholder")}
              showSearch
              className="w-full mt-4 sm:mt-0 sm:w-[200px] [&_.ant-select-selection-placeholder]:text-[15px]"
              options={SUPPORTED_SERACH_PROVIDERS}
              filterOption={(input, option) =>
                option!.label.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
                option!.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              {...form.getInputProps("searchProvider")}
            />
          </div>
        </div>
        {form.values.searchProvider === "searxng" && (
          <>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between">
              <span className="text-gray-700 dark:text-neutral-50">
                {t("generalSettings.webSearch.searxng.url.label")}
              </span>
              <div>
                <Input
                  placeholder="https://searxng.example.com"
                  className="w-full mt-4 sm:mt-0 sm:w-[200px]"
                  required
                  {...form.getInputProps("searxngURL")}
                />
              </div>
            </div>
          </>
        )}
        {form.values.searchProvider === "google" && (
          <>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between">
              <span className="text-gray-700 dark:text-neutral-50">
                {t("generalSettings.webSearch.googleDomain.label")}
              </span>
              <div>
                <Select
                  showSearch
                  className="w-full mt-4 sm:mt-0 sm:w-[200px] [&_.ant-select-selection-placeholder]:text-[15px]"
                  options={ALL_GOOGLE_DOMAINS.map((e) => ({
                    label: e,
                    value: e
                  }))}
                  filterOption={(input, option) =>
                    option!.label.toLowerCase().indexOf(input.toLowerCase()) >=
                    0 ||
                    option!.value.toLowerCase().indexOf(input.toLowerCase()) >=
                    0
                  }
                  {...form.getInputProps("googleDomain")}
                />
              </div>
            </div>
          </>
        )}
        {form.values.searchProvider === "brave-api" && (
          <>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between">
              <span className="text-gray-700 dark:text-neutral-50">
                {t("generalSettings.webSearch.braveApi.label")}
              </span>
              <div>
                <Input.Password
                  placeholder={t(
                    "generalSettings.webSearch.braveApi.placeholder"
                  )}
                  required
                  className="w-full mt-4 sm:mt-0 sm:w-[200px]"
                  {...form.getInputProps("braveApiKey")}
                />
              </div>
            </div>
          </>
        )}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between">
          <span className="text-gray-700 dark:text-neutral-50 ">
            {t("generalSettings.webSearch.searchMode.label")}
          </span>
          <div>
            <Switch
              className={`mt-4 sm:mt-0 ${form.values.isSimpleInternetSearch ? '!bg-indigo-500' : '!bg-gray-600'}`}
              size="small"
              {...form.getInputProps("isSimpleInternetSearch", {
                type: "checkbox"
              })}
            />
          </div>
        </div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between">
          <span className="text-gray-700 dark:text-neutral-50 ">
            {t("generalSettings.webSearch.totalSearchResults.label")}
          </span>
          <div>
            <InputNumber
              placeholder={t(
                "generalSettings.webSearch.totalSearchResults.placeholder"
              )}
              {...form.getInputProps("totalSearchResults")}
              className="!w-full mt-4 sm:mt-0 sm:w-[200px]"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between">
          <span className="text-gray-700 dark:text-neutral-50 ">
            {t("generalSettings.webSearch.visitSpecificWebsite.label")}
          </span>
          <div>
            <Switch
              className={`mt-4 sm:mt-0 ${form.values.visitSpecificWebsite ? '!bg-indigo-500' : '!bg-gray-600'}`}
              size="small"
              {...form.getInputProps("visitSpecificWebsite", {
                type: "checkbox"
              })}
            />
          </div>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between">
          <span className="text-gray-700 dark:text-neutral-50 ">
            {t("generalSettings.webSearch.searchOnByDefault.label")}
          </span>
          <div>
            <Switch
              className={`mt-4 sm:mt-0 ${form.values.defaultInternetSearchOn ? '!bg-indigo-500' : '!bg-gray-600'}`}
              size="small"
              {...form.getInputProps("defaultInternetSearchOn", {
                type: "checkbox"
              })}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <SaveButton btnType="submit" />
        </div>
      </form>
    </div>
  )
}
