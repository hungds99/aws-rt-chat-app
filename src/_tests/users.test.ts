import { UserServices } from '../services/users';

const userServices = new UserServices();

beforeAll(async () => {
  // await makeGlobalDatabase();
  // await userServices.create('Dummy user', 'dummy+001@gmail.com');
});

// afterAll(async () => {
//     deleteGlobalDatabase();
// });

describe('User services test case', () => {
  // it('should be created user successfully', async () => {
  //     const user = await userServices.create('Dinh Sy Hung', 'new+001@gmail.com');
  //     expect(user).toBeDefined();
  // });

  it('should be throw error when user already exists', () => {
    const mockFindByEmail = jest.spyOn(userServices, 'findByEmail').mockResolvedValue({
      email: 'dinhsyhung@gmail',
      userId: '1',
      userName: 'Dinh Sy Hung',
      createdAt: '123456789',
    });
    expect(
      async () => await userServices.create('Dinh Sy Hung', 'dinhsyhung@gmail.com'),
    ).rejects.toThrow('User already exists');
    expect(mockFindByEmail).toHaveBeenCalled();
    expect(mockFindByEmail).toBeCalledTimes(1);
  });
});
