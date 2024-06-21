const BASE_URL = "https://qytera-gmbh.github.io/projects/cypress-xray-plugin";

export const HELP = {
    plugin: {
        configuration: {
            authentication: {
                jira: {
                    root: `${BASE_URL}/section/configuration/authentication/#jira`,
                },
                root: `${BASE_URL}/section/configuration/authentication/`,
                xray: {
                    cloud: `${BASE_URL}/section/configuration/authentication/#xray-cloud`,
                    server: `${BASE_URL}/section/configuration/authentication/#xray-server`,
                },
            },
            cucumber: {
                prefixes: `${BASE_URL}/section/configuration/cucumber/#prefixes`,
            },
            introduction: `${BASE_URL}/section/configuration/introduction/`,
            jira: {
                projectKey: `${BASE_URL}/section/configuration/jira/#projectkey`,
                testExecutionIssueType: `${BASE_URL}/section/configuration/jira/#testExecutionIssueType`,
                testPlanIssueType: `${BASE_URL}/section/configuration/jira/#testPlanIssueType`,
                url: `${BASE_URL}/section/configuration/jira/#url`,
            },
            plugin: {
                debug: `${BASE_URL}/section/configuration/plugin/#debug`,
            },
        },
        guides: {
            targetingExistingIssues: `${BASE_URL}/section/guides/targetingExistingIssues/`,
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
