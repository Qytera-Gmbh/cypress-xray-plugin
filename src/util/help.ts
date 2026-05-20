const BASE_URL = "https://csvtuda.github.io/docs/cypress-xray-plugin";

export const HELP = {
    plugin: {
        configuration: {
            authentication: {
                jira: {
                    root: `${BASE_URL}/configuration/authentication/#jira`,
                },
                root: `${BASE_URL}/configuration/authentication/`,
                xray: {
                    cloud: `${BASE_URL}/configuration/authentication/#xray-cloud`,
                    server: `${BASE_URL}/configuration/authentication/#xray-server`,
                },
            },
            cucumber: {
                prefixes: `${BASE_URL}/configuration/cucumber/#prefixes`,
            },
            introduction: `${BASE_URL}/configuration/introduction/`,
            jira: {
                projectKey: `${BASE_URL}/configuration/jira/#projectkey`,
                testExecutionIssue: {
                    fields: {
                        issuetype: `${BASE_URL}/configuration/jira/#issuetype`,
                    },
                },
                url: `${BASE_URL}/configuration/jira/#url`,
            },
            plugin: {
                debug: `${BASE_URL}/configuration/plugin/#debug`,
            },
        },
        guides: {
            targetingExistingIssues: `${BASE_URL}/guides/targetingExistingIssues/`,
        },
    },
    xray: {
        importCucumberTests: {
            cloud: "https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2",
            server: "https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST",
        },
        installation: {
            cloud: "https://docs.getxray.app/display/XRAYCLOUD/Installation",
            server: "https://docs.getxray.app/display/XRAY/Installation",
        },
        issueTypeMapping: {
            cloud: "https://docs.getxray.app/display/XRAYCLOUD/Project+Settings%3A+Issue+Types+Mapping",
            server: "https://docs.getxray.app/display/XRAY/Configuring+a+Jira+project+to+be+used+as+an+Xray+Test+Project",
        },
    },
};
