import type { JSX } from "react";
import { Chip, PageContent, PageTitle, Stack, Typography } from "@wso2/oxygen-ui";

export function PendingApprovalPage(): JSX.Element {
  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Registration submitted</PageTitle.Header>
      </PageTitle>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <Typography>
          Your business is pending review by the platform. You&apos;ll be notified by email once
          approved.
        </Typography>
        <Chip label="Pending" color="warning" sx={{ alignSelf: "flex-start" }} />
      </Stack>
    </PageContent>
  );
}
