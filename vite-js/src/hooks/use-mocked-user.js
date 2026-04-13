import { _mock } from 'src/_mock';

// TO GET THE USER FROM THE AUTHCONTEXT, YOU CAN USE

// CHANGE:
// import { useMockedUser } from 'src/hooks/use-mocked-user';
// const { user } = useMockedUser();

// TO:
// import { useAuthContext } from 'src/auth/hooks';
// const { user } = useAuthContext();

// ----------------------------------------------------------------------

// export function useMockedUser() {
//   const user = {
//     id: '8864c717-587d-472a-929a-8e5f298024da-0',
//     displayName: 'Jaydon Frankie',
//     email: 'demo@minimals.cc',
//     password: 'demo1234',
//     photoURL: _mock.image.avatar(24),
//     phoneNumber: '+40 777666555',
//     country: 'United States',
//     address: '90210 Broadway Blvd',
//     state: 'California',
//     city: 'San Francisco',
//     zipCode: '94116',
//     about: 'Praesent turpis. Phasellus viverra nulla ut metus varius laoreet. Phasellus tempus.',
//     role: 'admin',
//     isPublic: true,
//   };

//   return { user };
// }
// src/hooks/use-mocked-user.js

export function useMockedUser() {
  // 🔹 localStorage se user info le lo
  const userCode = localStorage.getItem('userCode') || '';
  const designation = localStorage.getItem('designation') || '';

  const user = {
    userCode,
    designation,
    // optional: agar photo ya role chahiye to default values
    photoURL: '/assets/images/default-avatar.png',
    role: 'user',
  };

  return { user };
}
