import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartEntity } from './entities/cart.entity';
import { CartItemEntity } from './entities/cart-item.entity';

describe('CartService', () => {
  let service: CartService;

  const cartRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const cartItemRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(CartEntity), useValue: cartRepository },
        {
          provide: getRepositoryToken(CartItemEntity),
          useValue: cartItemRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('increments quantity when item already exists in cart', async () => {
    cartRepository.findOne.mockResolvedValue({ id: 10, userId: 1 });
    cartItemRepository.findOne.mockResolvedValue({
      id: 5,
      cartId: 10,
      productId: 7,
      quantity: 2,
    });
    cartItemRepository.save.mockResolvedValue(undefined);
    cartRepository.findOneOrFail.mockResolvedValue({
      id: 10,
      userId: 1,
      items: [{ id: 5, cartId: 10, productId: 7, quantity: 5 }],
    });

    const cart = await service.addItem(1, 7, 3);

    expect(cartItemRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, quantity: 5 }),
    );
    expect(cart).toEqual(
      expect.objectContaining({
        id: 10,
        items: [expect.objectContaining({ productId: 7, quantity: 5 })],
      }),
    );
  });

  it('creates item when item does not exist in cart', async () => {
    cartRepository.findOne.mockResolvedValue({ id: 10, userId: 1 });
    cartItemRepository.findOne.mockResolvedValue(null);
    cartItemRepository.create.mockReturnValue({
      cartId: 10,
      productId: 7,
      quantity: 3,
    });
    cartItemRepository.save.mockResolvedValue(undefined);
    cartRepository.findOneOrFail.mockResolvedValue({
      id: 10,
      userId: 1,
      items: [{ cartId: 10, productId: 7, quantity: 3 }],
    });

    const cart = await service.addItem(1, 7, 3);

    expect(cartItemRepository.create).toHaveBeenCalledWith({
      cartId: 10,
      productId: 7,
      quantity: 3,
    });
    expect(cartItemRepository.save).toHaveBeenCalled();
    expect(cart.items[0]).toEqual(expect.objectContaining({ quantity: 3 }));
  });
});
