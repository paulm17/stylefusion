import { Alert, AspectRatio, Badge, Button, Container } from "@raikou/server";
import { IconAt, IconInfoCircle, IconAdjustments } from "@tabler/icons-react";

export default function Page() {
  const icon = <IconInfoCircle />;
  return (
    <div
      style={{
        padding: "40px",
        width: "500px",
      }}
    >
      <Alert variant="light" color="blue" title="Alert title" icon={icon}>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. At officiis, quae tempore necessitatibus placeat saepe.
      </Alert>
      <div
        style={{
          padding: "10px",
          width: "500px",
        }}
      >
        <AspectRatio ratio={1080 / 720} maw={300} mx="auto">
          <img
            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-5.png"
            alt="Panda"
          />
        </AspectRatio>
      </div>

      <Badge>hello</Badge>
      <Button>hello 2</Button>

      <Container className="bg-[var(--raikou-color-blue-light)] h-[50px] mt-2">
        Default Container 1
      </Container>

      <Container
        size="xs"
        className="bg-[var(--raikou-color-blue-light)] h-[50px] mt-2"
      >
        xs Container
      </Container>

      <Container
        px={0}
        size="30rem"
        className="bg-[var(--raikou-color-blue-light)] h-[50px] mt-2"
      >
        30rem Container without padding
      </Container>      
    </div>
  );
}
