import React, { useState, useEffect } from 'react';
import { Container, Center, VStack, Text, Button, HStack, Input, useNumberInput } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

function Settings() {
  const [ghostSeconds, setGhostSeconds] = useState(() => {
    const val = localStorage.getItem('GHOST_LENGTH_MS');
    return val ? parseInt(val)/1000 : 5;
  });

  const { getInputProps, getIncrementButtonProps, getDecrementButtonProps } = useNumberInput({
    step: 1,
    defaultValue: ghostSeconds,
    min: 1,
    max: 60,
    precision: 0,
    onChange: (valueString) => setGhostSeconds(parseInt(valueString))
  });
  const inc = getIncrementButtonProps();
  const dec = getDecrementButtonProps();
  const input = getInputProps();

  useEffect(() => {
    localStorage.setItem('GHOST_LENGTH_MS', ghostSeconds * 1000);
  }, [ghostSeconds]);

  return (
    <Container maxW='sm' marginTop='25vh'>
      <Center>
        <VStack spacing={8}>
          <Text>ghost effect interval (seconds)</Text>
          <HStack maxW='200px'>
            <Button variant='ghost' {...dec}>-</Button>
            <Input readOnly variant='flushed' {...input} style={{textAlign: 'center'}} value={ghostSeconds}/>
            <Button variant='ghost' {...inc}>+</Button>
          </HStack>
          <Link to='/posts'>
            <Button variant='ghost'>done</Button>
          </Link>
        </VStack>
      </Center>
    </Container>
  );
}

export default Settings;
