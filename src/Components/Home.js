import React from 'react';
import { Container, VStack, Button, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <Container maxW="sm" marginTop="20vh">
      <VStack spacing={6}>
        <Text fontSize="xl" color="gray.600" textAlign="center">
          Welcome to Zenn
        </Text>
        <Button as={Link} to="/about" colorScheme="gray" variant="outline" width="100%">
          about
        </Button>
        <Button as={Link} to="/editor" colorScheme="blue" width="100%">
          write
        </Button>
      </VStack>
    </Container>
  );
}

export default Home;
