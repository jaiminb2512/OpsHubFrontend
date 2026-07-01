import { Box, Card, CardContent, Typography } from '@mui/material';
import type { PaginationMeta } from '../../Services/ApiServices';
import { getImageUrl } from '../../Utils/api';
import CustomTablePaginationComponent from './CustomTablePagination';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export interface CardField<T> {
  id: string;
  label: string;
  render: (item: T) => React.ReactNode;
  showLabel?: boolean;
}

export interface CardAction<T> {
  id: string;
  render: (item: T) => React.ReactNode;
}

interface DataCardGridProps<T> {
  data: T[];
  getCardTitle: (item: T) => string;
  getCardSubtitle?: (item: T) => string;
  getCardImage?: (item: T) => React.ReactNode; // Optional card image renderer
  getCardImages?: (item: T) => string[]; // Optional multiple images array
  fields: CardField<T>[];
  actions: CardAction<T>[];
  getRowKey: (item: T) => string | number;
  paginationMeta?: PaginationMeta | null;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  showPagination?: boolean;
  searchTerm?: string;
  columns?: number; // Number of columns in grid (default: 3)
}

function DataCardGrid<T>({
  data,
  getCardTitle,
  getCardSubtitle,
  getCardImage,
  getCardImages,
  fields,
  actions,
  getRowKey,
  paginationMeta,
  currentPage = 0,
  pageSize = 10,
  onPageChange,
  onRowsPerPageChange,
  showPagination = true,
  searchTerm = '',
  columns = 3,
}: DataCardGridProps<T>) {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dotsClass: 'slick-dots slick-thumb',
    customPaging: () => (
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: '#ccc',
          transition: 'all 0.3s',
        }}
      />
    ),
  };

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: `repeat(${columns}, 1fr)`,
          },
          gap: { xs: 2, sm: 2.5, md: 3 },
          width: '100%',
        }}
      >
        {data.map((item) => (
          <Box key={getRowKey(item)} sx={{ width: '100%', minWidth: 0 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%',
              }}
            >
              {(getCardImage || getCardImages) && (
                <Box
                  sx={{
                    width: { xs: '100%', sm: 200 },
                    minWidth: { xs: '100%', sm: 200 },
                    maxWidth: { xs: '100%', sm: 200 },
                    height: { xs: 200, sm: '100%' },
                    minHeight: 200,
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0,
                    overflow: 'hidden',
                    '& .slick-slider': {
                      width: '100%',
                      height: '100%',
                    },
                    '& .slick-list': {
                      height: '100%',
                    },
                    '& .slick-track': {
                      height: '100%',
                    },
                    '& .slick-slide': {
                      height: '100%',
                      '& > div': {
                        height: '100%',
                      },
                    },
                    '& .slick-dots': {
                      bottom: '10px',
                      '& li': {
                        margin: '0 3px',
                        '& button': {
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          padding: 0,
                          '&:before': {
                            content: '""',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            bgcolor: '#fff',
                            opacity: 0.5,
                          },
                        },
                        '&.slick-active button:before': {
                          bgcolor: '#667eea',
                          opacity: 1,
                        },
                      },
                    },
                  }}
                >
                  {getCardImages ? (
                    (() => {
                      const images = getCardImages(item);
                      return images.length > 1 ? (
                        <Slider {...sliderSettings}>
                          {images.map((imgUrl, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                width: '100%',
                                height: 200,
                                display: 'flex !important',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Box
                                component="img"
                                src={getImageUrl(imgUrl)}
                                alt={`${getCardTitle(item)} ${idx + 1}`}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                                }}
                              />
                            </Box>
                          ))}
                        </Slider>
                      ) : images.length === 1 ? (
                        <Box
                          component="img"
                          src={getImageUrl(images[0])}
                          alt={getCardTitle(item)}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#f0f0f0',
                            color: '#999',
                          }}
                        >
                          <Typography variant="body2">No Image</Typography>
                        </Box>
                      );
                    })()
                  ) : (
                    getCardImage && getCardImage(item)
                  )}
                </Box>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
                <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 }, pb: 1, minWidth: 0, overflow: 'hidden' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                    }}
                  >
                    {getCardTitle(item)}
                  </Typography>
                  {getCardSubtitle && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}
                    >
                      {getCardSubtitle(item)}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 1 }, mt: { xs: 1.5, sm: 2 }, width: '100%', minWidth: 0 }}>
                    {fields.map((field) => (
                      <Box key={field.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%', minWidth: 0 }}>
                        {field.showLabel !== false && (
                          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80, flexShrink: 0 }}>
                            {field.label}:
                          </Typography>
                        )}
                        <Box sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{field.render(item)}</Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
                {actions.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      p: { xs: 1.5, sm: 2 },
                      pt: 0,
                      borderTop: '1px solid #f0f0f0',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {actions.map((action) => (
                      <Box key={action.id}>{action.render(item)}</Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Card>
          </Box>
        ))}
      </Box>
      {showPagination && !searchTerm && paginationMeta && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <CustomTablePaginationComponent
            count={paginationMeta.totalCount}
            page={currentPage}
            rowsPerPage={pageSize}
            onPageChange={onPageChange || (() => { })}
            onRowsPerPageChange={onRowsPerPageChange || (() => { })}
          />
        </Box>
      )}
    </>
  );
}

export default DataCardGrid;

