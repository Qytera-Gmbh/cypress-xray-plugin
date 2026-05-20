import type { Background, Comment } from "@cucumber/messages";

/**
 * Extracts all comments which are relevant for linking a background to precondition issues.
 *
 * @param background - the background
 * @param comments - the feature file comments
 * @returns the relevant comments
 */
export function getCucumberPreconditionIssueComments(
    background: Background,
    comments: readonly Comment[]
): Comment[] {
    if (background.steps.length === 0) {
        return [];
    }
    const backgroundLine = background.location.line;
    const firstStepLine = background.steps[0].location.line;
    return comments
        .filter((comment: Comment) => comment.location.line > backgroundLine)
        .filter((comment: Comment) => comment.location.line < firstStepLine);
}

export function getCucumberPreconditionIssueTags(
    background: Background,
    projectKey: string,
    comments: readonly Comment[],
    preconditionPrefix?: string
): string[] {
    const preconditionKeys: string[] = [];
    if (background.steps.length > 0) {
        for (const comment of comments) {
            const matches = comment.text.match(
                getBackgroundTagRegex(projectKey, preconditionPrefix)
            );
            if (!matches) {
                continue;
            }
            // We know the regex: the match will contain the value in the first group.
            preconditionKeys.push(matches[1]);
        }
    }
    return preconditionKeys;
}

function getBackgroundTagRegex(projectKey: string, preconditionPrefix?: string): RegExp {
    if (preconditionPrefix) {
        // @Precondition:CYP-111
        return new RegExp(`@${preconditionPrefix}(${projectKey}-\\d+)`);
    }
    // @CYP-111
    return new RegExp(`@(${projectKey}-\\d+)`);
}
